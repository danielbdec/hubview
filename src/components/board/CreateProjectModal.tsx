import React, { useState } from 'react';
import { Modal, Form, Input } from 'antd';
import { useBoardStore } from '@/store/boardStore';

interface CreateProjectModalProps {
    visible: boolean;
    onCancel: () => void;
    onSuccess: () => void;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ visible, onCancel, onSuccess }) => {
    const [form] = Form.useForm();
    const addProject = useBoardStore((state) => state.addProject);
    const [loading, setLoading] = useState(false);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);
            // Simulate generic async behavior if needed, practically instant here
            addProject(values.title, values.description);
            form.resetFields();
            onSuccess();
        } catch (error) {
            console.error('Validation failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Novo Projeto"
            open={visible}
            onOk={handleOk}
            confirmLoading={loading}
            onCancel={onCancel}
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    name="title"
                    label="Título do Projeto"
                    rules={[{ required: true, message: 'Por favor insira o título!' }]}
                >
                    <Input placeholder="Ex: Campanha de Marketing" />
                </Form.Item>
                <Form.Item name="description" label="Descrição">
                    <Input.TextArea placeholder="Breve descrição do projeto..." />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default CreateProjectModal;
