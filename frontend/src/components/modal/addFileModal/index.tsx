import React, { useState } from 'react';
import { Modal, Form, Input, Select, Upload, Progress, message } from 'antd';
import { UploadOutlined, LinkOutlined, FileTextOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import type { RcFile } from 'rc-upload/lib/interface';
import { useDispatchNoteSource, useNotebookSelector } from '../../../hooks';

const { Option } = Select;

interface AddFileModalProps {
    visible: boolean;
    onCancel: () => void;
}

const AddFileModal: React.FC<AddFileModalProps> = ({ visible, onCancel }) => {
    const [form] = Form.useForm();
    const [sourceType, setSourceType] = useState<string>('docs');
    const [fileList, setFileList] = useState<RcFile[]>([]);
    const [loading, setLoading] = useState(false);
    const maxSources = 50;
    const { addNewNoteSource } = useDispatchNoteSource();
    const notebook = useNotebookSelector((state) => state.notebook.notebookDetails);

    // Handle form submission
    const handleSubmit = async () => {
        try {
            if (!notebook) return;
            const values = await form.validateFields();

            if (sourceType === 'docs') {
                if (fileList.length === 0) {
                    message.error('请上传文件');
                    return;
                }

                setLoading(true);
                message.loading({ content: '文件上传中...', key: 'uploading' });

                const fileType = values?.sourceType || 'docs';

                const uploadResults = await Promise.allSettled(
                    fileList.map(async (file, index) => {
                        try {
                            const response = await addNewNoteSource(notebook.id, { file, file_type: fileType });

                            // 确保后端返回的是正确的响应格式，如果失败则 throw error
                            if (!response || response.error) {
                                throw new Error(response?.error || "上传失败");
                            }

                            message.success({ content: `文件 ${index + 1}/${fileList.length} 上传成功`, key: `uploading_${index}`, duration: 2 });
                            return { success: true };
                        } catch (error) {
                            message.error({ content: `文件 ${index + 1}/${fileList.length} 上传失败: ${error.message}`, key: `uploading_${index}`, duration: 2 });
                            return { success: false };
                        }
                    })
                );

                const allSuccess = uploadResults.every(result => result.status === "fulfilled" && result.value?.success);

                if (allSuccess) {
                    message.success({ content: '所有文件上传成功', key: 'uploading', duration: 2 });
                    onCancel();
                    form.resetFields();
                    setSourceType('docs');
                    setFileList([]);
                }
            } else {
                message.error('请上传文件');
                return;
            }
        } catch (error) {
            message.error('文件上传过程中出现错误，请重试');
        } finally {
            setLoading(false);
        }
    };

// 限制上传文件类型
    const beforeUpload = (file: RcFile) => {
        const allowedTypes = [
            'application/pdf',           // PDF
            'text/plain',                // TXT
            'text/markdown',             // Markdown
            'application/msword',        // DOC (老版 Word)
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX (新版 Word)
            'text/csv',                  // CSV
            'application/vnd.ms-excel', ]  // 兼容部分 CSV;
        if (!allowedTypes.includes(file.type)) {
            message.error(`不支持的文件类型: ${file.name}`);
            return Upload.LIST_IGNORE;
        }

        if (fileList.length >= maxSources) {
            message.warning(`最多只能上传 ${maxSources} 个文件`);
            return Upload.LIST_IGNORE;
        }

        setFileList([...fileList, file]);
        return false;
    };
    // Upload properties and restrictions
    const uploadProps: UploadProps = {
        name: 'file',
        multiple: false,
        fileList,
        beforeUpload,
        onRemove: file => {
            setFileList(fileList.filter(f => f.uid !== file.uid));
        },
    };

    return (
        <Modal
            title={<h2>添加来源</h2>}
            open={visible}
            onCancel={() => {
                onCancel();
                form.resetFields();
                setSourceType('docs');
                setFileList([]);
            }}
            onOk={handleSubmit}
            okText="提交"
            cancelText="取消"
            confirmLoading={loading}  // 按钮加载状态
            width="80%"
        >
            <Form layout="vertical" form={form}>
                <Form.Item label="选择来源类型" name="sourceType">
                    <Select
                        placeholder="选择来源类型"
                        style={{ width: '100%' }}
                        defaultValue={'docs'}
                        onChange={(value) => setSourceType(value)}
                    >
                        <Option value="docs">
                            <FileTextOutlined /> 文档
                        </Option>
                        {/*<Option value="link">*/}
                        {/*    <LinkOutlined /> 网站链接*/}
                        {/*</Option>*/}
                        {/*<Option value="text">*/}
                        {/*    <FileTextOutlined /> 复制文本*/}
                        {/*</Option>*/}
                    </Select>
                </Form.Item>

                {sourceType === 'docs' && (
                    <Form.Item label="上传文件" name="fileUpload" rules={[{ required: true, message: '请上传文件' }]}>
                        <Upload.Dragger {...uploadProps}>
                            <p className="ant-upload-drag-icon">
                                <UploadOutlined />
                            </p>
                            <p className="ant-upload-text">拖放或选择文件进行上传</p>
                            <p className="ant-upload-hint">支持的文件类型: PDF, .txt, Markdown，DOC，DOCX，CSV</p>
                        </Upload.Dragger>
                    </Form.Item>
                )}

                {sourceType === 'link' && (
                    <Form.Item label="网站链接" name="websiteLinks" rules={[{ required: true, message: '请输入网站链接' }]}>
                        <Input.TextArea rows={4} placeholder="输入网站链接，以分号 ';' 分隔多个链接" />
                    </Form.Item>
                )}

                {sourceType === 'text' && (
                    <Form.Item label="粘贴文本" name="pastedText" rules={[{ required: true, message: '请粘贴文本内容' }]}>
                        <Input.TextArea rows={4} placeholder="粘贴文本内容" />
                    </Form.Item>
                )}

                {sourceType === 'docs' && (
                    <Progress
                        percent={(fileList.length / maxSources) * 100}
                        format={() => `${fileList.length}/${maxSources}`}
                        showInfo={fileList.length < maxSources}
                        status={fileList.length >= maxSources ? 'exception' : 'normal'}
                    />
                )}
            </Form>
        </Modal>
    );
};

export default AddFileModal;
