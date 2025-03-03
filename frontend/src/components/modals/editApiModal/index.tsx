import React, { useEffect } from 'react';
import { Modal, Form, Input, Button } from 'antd';

const EditApiModal = ({ visible, onCancel, onCreate, user }) => {
    const [form] = Form.useForm();

    useEffect(() => {
        if (visible && user) {
            form.setFieldsValue({
                API_KEY: user.API_KEY || '',
                username: user.username || '',
                nickname: user.nickname || '',
                email: user.email || '',
            });
        }
    }, [visible, user, form]);

    const handleOk = () => {
        form.validateFields()
            .then(values => {
                const formData = {
                    ...values,
                    username: user?.username || '',
                    nickname: user?.nickname || '',
                    email: user?.email || '',
                };
                onCreate(formData);
                form.resetFields(); // 提交后重置表单
            })
            .catch(info => {
                console.log('Validate Failed:', info);
            });
    };

    const handleCancel = () => {
        form.resetFields(); // 关闭时清空表单，防止数据残留
        onCancel();
    };

    return (
        <Modal
            title="更新API-KEY"
            open={visible}
            onCancel={handleCancel}
            footer={[
                <Button key="cancel" onClick={handleCancel}>
                    取消
                </Button>,
                <Button key="submit" type="primary" onClick={handleOk}>
                    确定
                </Button>,
            ]}
        >
            <Form
                form={form}
                layout="vertical"
                name="edit_api_form"
            >
                {/* 隐藏 username、nickname、email，确保提交时包含 */}
                <Form.Item name="username" hidden>
                    <Input />
                </Form.Item>
                <Form.Item name="nickname" hidden>
                    <Input />
                </Form.Item>
                <Form.Item name="email" hidden>
                    <Input />
                </Form.Item>

                <Form.Item
                    name="API_KEY"
                    label="API-KEY"
                    rules={[{ required: true, message: '请输入API-KEY' }]}
                >
                    <Input placeholder="请输入API-KEY" />
                </Form.Item>

                <p>
                    点击 <a href="https://api.rcouyi.com/" target="_blank" rel="noopener noreferrer">此处</a> 获取 API-KEY
                </p>
            </Form>
        </Modal>
    );
};

export default EditApiModal;
