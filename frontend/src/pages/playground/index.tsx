import React, {useEffect, useState} from 'react';
import {Button, Card, Divider, Dropdown, Space, Table, Typography, Modal, Input, message, Menu, Popover} from 'antd';
import type {MenuProps, TableColumnsType} from 'antd';
import {
    PlusOutlined,
    AppstoreOutlined,
    BarsOutlined,
    SettingOutlined,
    UserOutlined,
    MoreOutlined,
    DeleteOutlined,
    EditOutlined,
    FileOutlined, CheckOutlined, CloseOutlined
} from '@ant-design/icons';
import {useDispatchNotebook, useNotebookSelector, useDispatchUser} from '../../hooks';
import {NotebookRes, NotebookSourceRes} from "../../api/notebook";
import {useNavigate} from "react-router-dom";

const {Title} = Typography;

const viewMenuItems: MenuProps['items'] = [
    {
        key: '1',
        label: '最近',
    },
    {
        key: '2',
        label: '标题',
    },
    {
        key: '3',
        label: '与我分享',
    },
];

const columns: TableColumnsType<NotebookRes> = [
    {
        title: '标题',
        dataIndex: 'title',
        key: 'title',
        render: (title: string) => title,
    },
    {
        // title: '来源',
        // dataIndex: 'source',
        // key: 'source',
        // render: (source: NotebookSourceRes[]) => ``,
    },
    {
        title: '创建日期',
        dataIndex: 'created_time',
        key: 'created_time',
    }
];


const PlaygroundPage: React.FC = () => {
    const [isCardView, setIsCardView] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const {getAllNotebooks, addNewNotebook, removeNotebook} = useDispatchNotebook();
    const {logoutUser} = useDispatchUser();
    const notebooks = useNotebookSelector((state) => state.notebook.notebooks);
    const navigate = useNavigate();
    const notebook = useNotebookSelector((state) => state.notebook.notebookDetails);
    // States for title editing
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState('');

    const {updateNotebookInfo} = useDispatchNotebook();
    useEffect(() => {
        getAllNotebooks();
    }, [getAllNotebooks]);

    const toggleView = () => {
        setIsCardView(!isCardView);
    };

    const showCreateModal = () => {
        setIsModalVisible(true);
    };

    const handleCreateNotebook = async () => {
        if (!newTitle.trim()) {
            message.error("标题不能为空！");
            return;
        }
        try {
            await addNewNotebook({title: newTitle});
            message.success("笔记本创建成功！");
            setIsModalVisible(false);
            setNewTitle('');
            window.location.reload();
        } catch (error) {
            message.error("创建失败，请稍后重试！");
        }
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setNewTitle('');
    };



    const handlePersonalClick = () => {
        navigate('/note/personal');
    };

    const handleNotebookClick = (uuid: string) => {
        navigate('/note/notebook/' + uuid);
    };

    const handleLogout = () => {
        logoutUser();
        message.success("您已成功退出登录！");

    };

    const userMenu = (
        <Menu>

            <Menu.Item key="1" onClick={handlePersonalClick}>
                个人中心
            </Menu.Item>
            <Menu.Item key="2" onClick={handleLogout}>
                退出登录
            </Menu.Item>
        </Menu>
    );

    const handleDeleteNotebook = async (id: number) => {
        Modal.confirm({
            title: '确认删除',
            content: '确定要删除这个笔记本吗？此操作不可恢复。',
            okText: '确认',
            cancelText: '取消',
            onOk: async () => {
                try {
                    await removeNotebook({pk: [id]});
                    message.success("笔记本删除成功！");
                    getAllNotebooks();
                } catch (error) {
                    message.error("删除失败，请稍后重试！");
                }
            }
        });
    };

    const handleTitleEdit = async () => {
        // if (!notebook) return;
        try {
            console.log(notebook.id)
            await updateNotebookInfo(notebook.id, {title});
            message.success("Title updated successfully");
            // setIsEditing(false);
        } catch (error) {
            message.error("Failed to update title");
        }
    };

    return (
        <div style={{padding: '24px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <Title level={2}>欢迎使用 NotebookSapper</Title>
                <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
                    {/*<SettingOutlined style={{fontSize: '24px'}}/>*/}
                    <Dropdown overlay={userMenu} trigger={['click']}>
                        <UserOutlined style={{fontSize: '24px', cursor: 'pointer'}}/>
                    </Dropdown>
                </div>
            </div>

            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px'}}>
                <Title level={4}>我的笔记本</Title>
                <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
                    <Button type="primary" icon={<PlusOutlined/>} onClick={showCreateModal}>新建</Button>
                    <Space>
                        <Button icon={isCardView ? <BarsOutlined/> : <AppstoreOutlined/>} onClick={toggleView}/>
                        {/*<Dropdown menu={{ items: viewMenuItems }}>*/}
                        {/*    <Button>最近</Button>*/}
                        {/*</Dropdown>*/}
                    </Space>
                </div>
            </div>

            <Divider/>

            {isCardView ? (
                <div
                    style={{
                        marginTop: '24px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                        gap: '16px',
                    }}
                >
                    {notebooks.map((note) => (
                        <Card
                            key={note?.id}
                            style={{borderRadius: '10px'}}
                            title={<FileOutlined/>}
                            hoverable
                            extra={
                                <Dropdown
                                    overlay={
                                        <Menu>
                                            <Menu.Item
                                                key="1"
                                                onClick={() => {
                                                    handleDeleteNotebook(note?.id); // Now `note` is in scope
                                                }}
                                            >
                                                <DeleteOutlined/> 删除
                                            </Menu.Item>

                                            <Menu.Item key="2">
                                                <Popover content={

                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        marginBottom: "10px"
                                                    }}>
                                                        <Input
                                                            defaultValue={note?.title}
                                                            style={{width: '200px', marginRight: '8px'}}
                                                        />
                                                        <Button.Group>
                                                            <Button icon={<CheckOutlined/>} type="primary"
                                                                    onClick={handleTitleEdit}/>
                                                            {/*<Button icon={<CloseOutlined />} onClick={() => setIsEditing(false)} />*/}
                                                        </Button.Group>
                                                    </div>}

                                                         title="修改标题" trigger="click">
                                                    <EditOutlined/>修改标题

                                                </Popover>
                                            </Menu.Item>
                                        </Menu>
                                    }
                                    trigger={['click']}
                                >
                                    <Button type="text" icon={<MoreOutlined/>}/>
                                </Dropdown>
                            }
                        >
                            <Card.Meta
                                onClick={() => handleNotebookClick(note?.uuid)}
                                title={<h3>{note?.title}</h3>}
                                description={`${note?.created_time} `}

                            />
                        </Card>
                    ))}
                </div>

            ) : (
                <div>
                    {notebooks.length > 0 && (
                        <Table
                            columns={columns}
                            dataSource={notebooks}
                            rowKey="id"
                            style={{marginTop: '24px'}}
                            onRow={(record) => ({
                                onClick: () => handleNotebookClick(record.uuid), // 点击行时触发
                            })}
                        />
                    )}
                </div>
            )}

            <Modal
                title="新建笔记本"
                open={isModalVisible}
                onOk={handleCreateNotebook}
                onCancel={handleCancel}
                okText="创建"
                cancelText="取消"
            >
                <Input
                    placeholder="请输入笔记本标题"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                />
            </Modal>
        </div>
    );
};

export default PlaygroundPage;