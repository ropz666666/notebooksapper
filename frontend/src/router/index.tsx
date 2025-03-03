import {BrowserRouter as Router, Routes, Route, Outlet, Navigate} from 'react-router-dom';
import NotebookPage from '../pages/notebook';
import PlaygroundPage from '../pages/playground';
import Personal from '../pages/personal/index.tsx';
import { useEffect, useState,useMemo } from 'react';
import {getToken} from "../utils/auth.ts";
import { useDispatchUser } from "../hooks";


function AppRouter() {
    // 从 Redux 中获取用户信息
    const {fetchUser} = useDispatchUser();
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [loading, setLoading] = useState(true); // 新增加载状态
    const {logoutUser} = useDispatchUser();
    const token = getToken();
    console.log("token", token);

    useEffect(() => {
        const token = getToken();
        setLoading(true);
        const loadUser = async () => {
            try {
                if (token) {
                    const user = await fetchUser();
                    setCurrentUser(user.payload);
                    console.log(currentUser)
                    console.log("token", token);
                }
            } catch (error) {
            } finally {
                setLoading(false);
            }
        };
        token ? loadUser() : setLoading(false);
    }, [fetchUser, token]); // 添加 token 作为依赖项

    // 高阶组件：保护路由
    const ProtectedRoute = () => {
        const token = getToken();
        if (loading) {
            return <div>Loading...</div>;
        }
        console.log("token", token)
        console.log("currentUser", currentUser);
        // 最终有效条件是：Token 存在且用户数据已加载 ✅
        // const isAuthenticated = token && currentUser && currentUser.id !== undefined;
        if (currentUser == "Failed to fetch user info" && token) {

            logoutUser()
        }
        return token ? <Outlet/> : <Navigate to="/login" replace/>;
    }
        return (
            <Router>
                <Routes>

                    <Route element={<ProtectedRoute/>}>
                        <Route path="/note" element={<Navigate to="/note/playground" replace/>}/>
                        {/* 各个管理页面 */}
                        <Route path="/note/notebook/:uuid" element={<NotebookPage/>}/>
                        <Route path="/note/personal" element={<Personal/>}/>
                        <Route path="/note/playground" element={<PlaygroundPage/>}/>
                    </Route>
                </Routes>
            </Router>
        );
    }


export default AppRouter;
