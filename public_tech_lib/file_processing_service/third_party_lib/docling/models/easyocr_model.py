import logging
import warnings
from typing import Iterable

import numpy
import torch
from docling_core.types.doc import BoundingBox, CoordOrigin

from public_tech_lib.file_processing_service.third_party_lib.docling.datamodel.base_models import Cell, OcrCell, Page
from public_tech_lib.file_processing_service.third_party_lib.docling.datamodel.document import ConversionResult
from public_tech_lib.file_processing_service.third_party_lib.docling.datamodel.pipeline_options import (
    AcceleratorDevice,
    AcceleratorOptions,
    EasyOcrOptions,
)
from public_tech_lib.file_processing_service.third_party_lib.docling.datamodel.settings import settings
from public_tech_lib.file_processing_service.third_party_lib.docling.models.base_ocr_model import BaseOcrModel
from public_tech_lib.file_processing_service.third_party_lib.docling.utils.accelerator_utils import decide_device
from public_tech_lib.file_processing_service.third_party_lib.docling.utils.profiling import TimeRecorder

_log = logging.getLogger(__name__)


class EasyOcrModel(BaseOcrModel):
    def __init__(
        self,
        enabled: bool,
        options: EasyOcrOptions,
        accelerator_options: AcceleratorOptions,
    ):
        super().__init__(enabled=enabled, options=options)
        self.options: EasyOcrOptions

        self.scale = 3  # multiplier for 72 dpi == 216 dpi.

        if self.enabled:
            try:
                import easyocr
            except ImportError:
                raise ImportError(
                    "EasyOCR is not installed. Please install it via `pip install easyocr` to use this OCR engine. "
                    "Alternatively, Docling has support for other OCR engines. See the documentation."
                )

            if self.options.use_gpu is None:
                device = decide_device(accelerator_options.device)
                # Enable easyocr GPU if running on CUDA, MPS
                use_gpu = any(
                    [
                        device.startswith(x)
                        for x in [
                            AcceleratorDevice.CUDA.value,
                            AcceleratorDevice.MPS.value,
                        ]
                    ]
                )
            else:
                warnings.warn(
                    "Deprecated field. Better to set the `accelerator_options.device` in `pipeline_options`. "
                    "When `use_gpu and accelerator_options.device == AcceleratorDevice.CUDA` the GPU is used "
                    "to run EasyOCR. Otherwise, EasyOCR runs in CPU."
                )
                use_gpu = self.options.use_gpu

            self.reader = easyocr.Reader(
                lang_list=self.options.lang,
                gpu=use_gpu,
                model_storage_directory=self.options.model_storage_directory,
                recog_network=self.options.recog_network,
                download_enabled=self.options.download_enabled,
                verbose=False,
            )

    def __call__(
        self, conv_res: ConversionResult, page_batch: Iterable[Page]
    ) -> Iterable[Page]:

        if not self.enabled:
            yield from page_batch
            return

        for page in page_batch:

            assert page._backend is not None
            if not page._backend.is_valid():
                yield page
            else:
                with TimeRecorder(conv_res, "ocr"):
                    ocr_rects = self.get_ocr_rects(page)

                    all_ocr_cells = []
                    for ocr_rect in ocr_rects:
                        # Skip zero area boxes
                        if ocr_rect.area() == 0:
                            continue
                        high_res_image = page._backend.get_page_image(
                            scale=self.scale, cropbox=ocr_rect
                        )
                        im = numpy.array(high_res_image)
                        result = self.reader.readtext(im)

                        del high_res_image
                        del im

                        cells = [
                            OcrCell(
                                id=ix,
                                text=line[1],
                                confidence=line[2],
                                bbox=BoundingBox.from_tuple(
                                    coord=(
                                        (line[0][0][0] / self.scale) + ocr_rect.l,
                                        (line[0][0][1] / self.scale) + ocr_rect.t,
                                        (line[0][2][0] / self.scale) + ocr_rect.l,
                                        (line[0][2][1] / self.scale) + ocr_rect.t,
                                    ),
                                    origin=CoordOrigin.TOPLEFT,
                                ),
                            )
                            for ix, line in enumerate(result)
                            if line[2] >= self.options.confidence_threshold
                        ]
                        all_ocr_cells.extend(cells)

                    # Post-process the cells
                    page.cells = self.post_process_cells(all_ocr_cells, page.cells)

                # DEBUG code:
                if settings.debug.visualize_ocr:
                    self.draw_ocr_rects_and_cells(conv_res, page, ocr_rects)

                yield page
