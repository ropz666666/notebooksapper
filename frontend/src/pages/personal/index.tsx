import React, {useEffect, useState} from 'react';
import {Avatar, Button, Card, Splitter, Row, Col, message} from 'antd';
import EditUserModal from "../../components/modals/editUserModal";
import {updateUser} from "../../api/user.ts";
import {useNavigate} from "react-router-dom";
import {useDispatchUser} from "../../hooks";
import LayoutContainer from '../../components/layout';
import EditPasswordModal from "../../components/modals/editPasswordModal";
import EditApiModal from "../../components/modals/editApiModal";
import {useDispatch} from 'react-redux';
import {updatePasswordThunk} from "../../service/userService.tsx";
import {RegisterRes} from "../../api/auth.tsx";
import user from "../admin/user";

const Personal: React.FC = () => {
    const { fetchUser } = useDispatchUser();
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isEditUserModalVisible, setIsEditUserModalVisible] = useState(false);
    const [isEditPasswordModalVisible, setIsEditPasswordModalVisible] = useState(false);
    const [isEditApiModalVisible, setIsEditApiModalVisible] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const loadUser = async () => { // 将 loadUser 提取到外部
        const user = await fetchUser();
        console.log(JSON.stringify(user));
        setCurrentUser(user.payload);
    };

    useEffect(() => {
        loadUser(); // 调用异步函数
    }, []);

    const showEditUserModal = () => {
        setIsEditUserModalVisible(true);
    };

    const handleEditUser = async (userData: any) => {
        await updateUser(currentUser.username, userData);
        await loadUser(); // 确保这里也是异步调用
        setIsEditUserModalVisible(false);
    };

    const handleCancelEditUser = () => {
        setIsEditUserModalVisible(false);
    };

    const showEditPasswordModal = () => {
        setIsEditPasswordModalVisible(true);
    }

    const showEditApiModal = () => {
        setIsEditApiModalVisible(true);
    }
    const handleEditPassword = async (passwordData: any) => {
        const resultAction = await dispatch(updatePasswordThunk(passwordData)) as { payload: RegisterRes, error?: any };

        if (updatePasswordThunk.fulfilled.match(resultAction)) {
            const {data} = resultAction.payload; // 确保从 payload 中提取 msg
            message.success(data || "密码修改成功", 3);

        }
        setIsEditPasswordModalVisible(false);
    }

     const handleEditApi = async (userData: any) => {
        await updateUser(currentUser.username, userData);
        await loadUser(); // 确保这里也是异步调用
        setIsEditApiModalVisible(false);
    }

    const handleCancelEditPassword = () => {
        setIsEditPasswordModalVisible(false);
    }

    const handleCancelEditApi = () => {
        setIsEditApiModalVisible(false);
    }

    const data = currentUser ? [
        {
            key: '1',
            label: '昵称',
            content: currentUser.nickname,
        },
        {
            key: '2',
            label: '用户名',
            content: currentUser.username,
        },
        {
            key: '3',
            label: '邮箱',
            content: currentUser.email,
        },
    ] : [];

    return (
        <LayoutContainer>
        <div>
            <EditUserModal
                changeUsername={false}
                visible={isEditUserModalVisible}
                onCancel={handleCancelEditUser}
                onCreate={handleEditUser}
                user={currentUser}
            />

            <EditPasswordModal
                visible={isEditPasswordModalVisible}
                onCancel={handleCancelEditPassword}
                onCreate={handleEditPassword}
                user={currentUser}
            />

            <EditApiModal
                visible={isEditApiModalVisible}
                onCancel={handleCancelEditApi}
                onCreate={handleEditApi}
                user={currentUser}
            />

            <Splitter style={{height: "90vh", boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)'}}>
                <Splitter.Panel defaultSize="35%" min="20%" max="50%" style={{textAlign: 'center'}}>
                    <Card style={{height:"100%"}} title="用户信息">
                        <Avatar size={100} src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png"
                                alt="用户头像"/>
                        <div style={{margin: '20px 0'}}>
                            {data.map(item => (
                                <Row key={item.key} style={{marginBottom: 8}}>
                                    <Col span={8} style={{textAlign: 'right', paddingRight: 10}}>
                                        <strong>{item.label}:</strong>
                                    </Col>
                                    <Col span={16} style={{textAlign: 'left'}}>
                                        {item.content}
                                    </Col>
                                </Row>
                            ))}
                        </div>
                         <div style={{marginTop:"40vh"}}>
                                <Button
                                style={{position: "relative", bottom: "0vh"}}
                                onClick={showEditUserModal}
                            >
                                修改信息
                            </Button>
                            <Button
                                style={{position: "relative", bottom: "0vh"}}
                                onClick={showEditPasswordModal}
                            >
                                修改密码
                            </Button>
                             <Button
                                style={{position: "relative", bottom: "0vh"}}
                                onClick={showEditApiModal}
                            >
                                修改API-KEY
                            </Button>
                        </div>
                    </Card>

                </Splitter.Panel>
                <Splitter.Panel>
                    <Card style={{height:"100%"}} title="个人信息">
                        {/* 在这里添加个人信息内容 */}
                    </Card>
                </Splitter.Panel>
            </Splitter>
        </div>
        </LayoutContainer>
    );
};

export default Personal;
