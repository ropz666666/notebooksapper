import React, {useEffect, useState} from 'react';
import {Button, Card, Divider, Dropdown, Space, Table, Typography, Modal, Input, message, Menu, Popover} from 'antd';
import {HomeOutlined} from '@ant-design/icons';
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

    //修改状态初始化方式
    const [editingStates, setEditingStates] = useState<Record<number, { tempTitle: string | null }>>({});

    // 修改后的状态管理（每个笔记本独立状态）


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
    const user_items = [
        {
            key: '1',
            label: '退出登录', // 添加文字描述
            onClick: handleLogout
        }

    ];
    const userMenu = (
        <Menu items={user_items} />
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

    //修改后的处理函数
    const handleTitleEdit = async (id: number) => {
        const currentState = editingStates[id];
        if (!currentState?.tempTitle?.trim()) {
            message.error("标题不能为空");
            return;
        }

        try {
            await updateNotebookInfo(id, { title: currentState.tempTitle });
            message.success("修改成功");
            getAllNotebooks();
            setEditingStates(prev => {
                const newState = { ...prev };
                delete newState[id];
                return newState;
            });
        } catch (error) {
            // 修改失败时回滚到原始标题
            setEditingStates(prev => ({
                ...prev,
                [id]: {
                    tempTitle: currentState.originalTitle,
                    originalTitle: currentState.originalTitle
                }
            }));
            message.error("修改失败");
        }
    };

    return (
        <div style={{padding: '24px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <Title level={2}>欢迎使用 NotebookSapper</Title>
                <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
                    <Button
                        type="primary"
                        icon={<HomeOutlined />}
                        onClick={() => window.location.href = '/'} // 替换为实际的主页URL
                        style={{ marginRight: '8px' }}
                    >
                        返回主页
                    </Button>
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
                                        <Menu
                                            items={[
                                                {
                                                    key: '1',
                                                    label: (
                                                        <span>
                                                        <DeleteOutlined /> 删除
                                                        </span>
                                                    ),
                                                    onClick: () => handleDeleteNotebook(note?.id)
                                                },
                                                {
                                                    key: '2',
                                                    label: (
                                                        <Popover
                                                            content={
                                                                <div
                                                                    style={{ display: 'flex', alignItems: 'center', marginBottom: "10px" }}
                                                                    onClick={e => e.stopPropagation()}
                                                                >
                                                                    <Input
                                                                        value={editingStates[note.id]?.tempTitle ?? ''} // 始终显示编辑状态
                                                                        onChange={(e) => setEditingStates(prev => ({
                                                                            ...prev,
                                                                            [note.id]: {
                                                                                tempTitle: e.target.value,
                                                                                originalTitle: note.title // 保留原始标题用于回滚
                                                                            }
                                                                        }))}
                                                                        style={{ width: '200px', marginRight: '8px' }}
                                                                        status={editingStates[note.id]?.tempTitle === '' ? 'error' : undefined}
                                                                    />
                                                                    <Space.Compact>
                                                                        <Button
                                                                            icon={<CheckOutlined />}
                                                                            type="primary"
                                                                            disabled={!editingStates[note.id]?.tempTitle?.trim()}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleTitleEdit(note.id);
                                                                            }}
                                                                        />
                                                                        <Button
                                                                            icon={<CloseOutlined />}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setEditingStates(prev => {
                                                                                    const newState = { ...prev };
                                                                                    delete newState[note.id];
                                                                                    return newState;
                                                                                });
                                                                            }}
                                                                        />
                                                                    </Space.Compact>
                                                                </div>
                                                            }
                                                            title="修改标题"
                                                            trigger="click"
                                                            open={!!editingStates[note.id]}
                                                            onOpenChange={(visible) => {
                                                                if (!visible) {
                                                                    setEditingStates(prev => {
                                                                        const newState = { ...prev };
                                                                        delete newState[note.id];
                                                                        return newState;
                                                                    });
                                                                }
                                                            }}
                                                        >
      <span onClick={(e) => {
          e.stopPropagation();
          setEditingStates(prev => ({
              ...prev,
              [note.id]: {
                  tempTitle: note.title, // 初始化时设置临时标题为当前标题
                  originalTitle: note.title
              }
          }));
      }}>
        <EditOutlined /> 修改标题
      </span>
                                                        </Popover>
                                                    )
                                                }
                                            ]}
                                        />
                                    }
                                    trigger={['click']}
                                >
                                    <Button type="text" icon={<MoreOutlined/>}/>
                                </Dropdown>
                            }
                        >
                            <Card.Meta
                                onClick={(e) => {
                                    if (editingStates[note.id]) { // 编辑时阻止跳转
                                        e.stopPropagation();
                                    } else {
                                        handleNotebookClick(note.uuid);
                                    }
                                }}
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