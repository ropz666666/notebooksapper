import {useCallback} from 'react';
import {useDispatch} from 'react-redux';
import {
    loginUser,
    logout,
    fetchUserInfo,
    fetchCaptcha,
    fetchUserList,
    fetchUserMenu,
    addUserThunk,
    updateUserThunk,
    deleteUserThunk,
    changeUserStatusThunk,
    changeUserSuperThunk,
    changeUserStaffThunk,
    changeUserMultiThunk, updateUserRoleThunk, updateUserDeptThunk
} from '../service/userService';  // Assuming you have these thunks created in service
import {setInfo, resetInfo} from '../store/userSlice.tsx';
import {UserState} from '../types';
import {SysUserAddReq, SysUserDeptReq, SysUserInfoReq, SysUserParams, SysUserRoleReq} from '../api/user';
import {LoginData} from "../api/auth.tsx";
import {AppDispatch} from "../store";
import {clearToken} from "../utils/auth.ts";
// Custom Hook to handle user-related dispatch actions
export function useDispatchUser() {
    const dispatch = useDispatch<AppDispatch>();

    // Login action
    const login = useCallback((loginData: LoginData) => {
        return dispatch(loginUser(loginData));
    }, [dispatch]);

    // Logout action
    const logoutUser = useCallback(() => {
        dispatch(logout());
        // 重定向到登录页面
        window.location.href = '/login'; // 更新为你的登录页面路径
        // 清除用户身份信息
        clearToken()
        window.location.reload();
    }, [dispatch]);

    // Fetch user information
    const fetchUser = useCallback(() => {
        return dispatch(fetchUserInfo());  // Returns a promise
    }, [dispatch]);

    // Fetch user list
    const fetchUsers = useCallback((params: SysUserParams) => {
        return dispatch(fetchUserList(params));  // Fetch users with parameters
    }, [dispatch]);

    const getUserMenu = useCallback(() => {
        return dispatch(fetchUserMenu());  // Fetch users with parameters
    }, [dispatch]);

    // Add a new user
    const addUser = useCallback((userData: SysUserAddReq) => {
        return dispatch(addUserThunk(userData));
    }, [dispatch]);

    // Update existing user
    const updateUser = useCallback((username: string, data: SysUserInfoReq) => {
        return dispatch(updateUserThunk({username, data}));
    }, [dispatch]);

    // Update existing user role
    const updateUserRole = useCallback((username: string, data) => {
        return dispatch(updateUserRoleThunk({username, data}));
    }, [dispatch]);

    // Update existing user dept
    const updateUserDept = useCallback((username: string, data: SysUserDeptReq) => {
        return dispatch(updateUserDeptThunk({username, data}));
    }, [dispatch]);

    // Delete a user
    const deleteUser = useCallback((username: string) => {
        return dispatch(deleteUserThunk(username));
    }, [dispatch]);

    // Change user status
    const changeStatus = useCallback((pk: number) => {
        return dispatch(changeUserStatusThunk(pk));
    }, [dispatch]);

    // Toggle superuser status
    const toggleSuperuser = useCallback((pk: number) => {
        return dispatch(changeUserSuperThunk(pk));
    }, [dispatch]);

    // Toggle staff status
    const toggleStaffStatus = useCallback((pk: number) => {
        return dispatch(changeUserStaffThunk(pk));
    }, [dispatch]);

    // Toggle multi-login status
    const toggleMultiLogin = useCallback((pk: number) => {
        return dispatch(changeUserMultiThunk(pk));
    }, [dispatch]);

    // Set partial user info
    const setUserInfo = useCallback((info: Partial<UserState>) => {
        dispatch(setInfo(info));
    }, [dispatch]);

    // Get captcha image
    const getCaptcha = useCallback(() => {
        return dispatch(fetchCaptcha());
    }, [dispatch]);

    // Reset user information
    const resetUserInfo = useCallback(() => {
        dispatch(resetInfo());
    }, [dispatch]);

    return {
        login,
        logoutUser,
        fetchUser,
        fetchUsers,
        addUser,
        updateUser,
        updateUserDept,
        updateUserRole,
        deleteUser,
        changeStatus,
        toggleSuperuser,
        toggleStaffStatus,
        toggleMultiLogin,
        setUserInfo,
        resetUserInfo,
        getUserMenu,
        getCaptcha,
    };
}
