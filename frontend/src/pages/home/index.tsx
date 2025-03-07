import React, {useEffect} from 'react';
import {useNavigate} from "react-router-dom";

const HomePage: React.FC = () => {

    const navigate = useNavigate(); // 使用 useNavigate hook

    useEffect(() => {
        navigate('/note/playground'); // 跳转到 /playground 页面
    }, []);

    return (
        <div>欢迎页面</div>
    )
};

export default HomePage;