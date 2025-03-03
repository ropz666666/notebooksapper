from dataclasses import is_dataclass, asdict
from typing import List, Any

import pandas as pd


def save_model_to_csv(dataclasses_list: List[Any], csv_file_path: str):
    if not dataclasses_list:
        raise ValueError("The dataclasses_list is empty.")

    # ����һ��Ԫ���Ƿ�Ϊ dataclass
    if not is_dataclass(dataclasses_list[0]):
        raise ValueError("Items in the list must be dataclass instances.")

    # ��ÿ�� dataclass ����ת��Ϊ�ֵ�
    dict_list = [asdict(item) for item in dataclasses_list]

    # ʹ�� pandas ���� DataFrame
    df = pd.DataFrame(dict_list)

    # ���浽 CSV
    df.to_csv(csv_file_path, index=False, encoding='utf-8')
