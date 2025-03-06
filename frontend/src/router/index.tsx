import {BrowserRouter as Router, Routes, Route, Outlet, Navigate} from 'react-router-dom';
import NotebookPage from '../pages/notebook';
import PlaygroundPage from '../pages/playground';
import Personal from '../pages/personal/index.tsx';
import { useEffect, useState, useRef, useCallback } from 'react';
import {getToken} from "../utils/auth.ts";
import { useDispatchUser } from "../hooks";
import { Modal } from 'antd'; // 如果是Ant Design


function AppRouter() {
    // 从 Redux 中获取用户信息
    const {fetchUser} = useDispatchUser();
    const [loading, setLoading] = useState(true); // 新增加载状态
    const {logoutUser} = useDispatchUser();
    const currentUserRef = useRef();
    const [modalVisible, setModalVisible] = useState(false);

    // 加载用户信息
    const loadUser = useCallback(async () => {
        try {
            const user = await fetchUser();
            currentUserRef.current = user.payload; // 更新用户信息
            if(currentUserRef.current == "Failed to fetch user info" && getToken()) { logoutUser();}
            const settings = user.payload.settings ? JSON.parse(user.payload.settings) : {};
            if (!settings.api_key) {
                setModalVisible(true); // 如果没有 api_key，显示 Modal
            }
        } catch (error) {
            console.error('Failed to fetch user info:', error);
            if (getToken()) {
                logoutUser(); // 如果 token 存在但获取用户信息失败，执行登出
            }
        } finally {
            setLoading(false); // 结束加载
        }
    }, [fetchUser, logoutUser]);

    useEffect(() => {
        const token = getToken();
        if (token) {
            loadUser(); // 如果有 token，加载用户信息
        } else {
            setLoading(false); // 如果没有 token，直接结束加载
        }
    }, [loadUser]);

    // 保护路由的高阶组件
    const ProtectedRoute = () => {
        const token = getToken();
        if (loading) {
            return <div>Loading...</div>; // 加载中显示 Loading
        }
        if (!token) {
            return <Navigate to="/login" replace />; // 如果没有 token，跳转到登录页
        }
        return <Outlet />; // 如果有 token，渲染子路由
    };

// API Key 提示 Modal
    const ApiKeyModal = () => (
        <Modal
            title="API_Key 未填写"
            open={modalVisible}
            onOk={() => {
                setModalVisible(false);
                window.location.href = '/personal'; // 跳转到设置页面
            }}
            style={{top:"30%"}}
            okText="前往设置"
            closable={false} // 禁止关闭 Modal
        >
            <p>使用该功能需要先配置 API_Key，是否立即前往设置？</p>
        </Modal>
    );

    return (
        <Router>
            <ApiKeyModal />
            <Routes>
                <Route element={<ProtectedRoute />}>
                    <Route path="/note" element={<Navigate to="/note/playground" replace />} />
                    <Route path="/note/notebook/:uuid" element={<NotebookPage />} />
                    <Route path="/note/personal" element={<Personal />} />
                    <Route path="/note/playground" element={<PlaygroundPage />} />
                </Route>
            </Routes>
        </Router>
    );
}


export default AppRouter;
