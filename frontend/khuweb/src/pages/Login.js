import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";

const Login = ({ setIsLoggedIn }) => {
  const [매장명, set매장명] = useState("");
  const [매장_비밀번호, set매장_비밀번호] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/accounts/login/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 매장명, 매장_비밀번호 }),
        }
      );

      if (response.ok) {
        const data = await response.json();

        if (매장명 === "admin") {
          localStorage.setItem("access", data.access);
          localStorage.setItem("refresh", data.refresh);
          setIsLoggedIn(true);
          navigate("/khuweb/home"); // 홈 페이지로 이동
        } else {
          setError("아이디 또는 비밀번호가 올바르지 않습니다.");
        }
      } else {
        setError("아이디 또는 비밀번호가 올바르지 않습니다.");
      }
    } catch (err) {
      setError("로그인 요청 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="login-page">
      <div className="login-logo">
        <img
          src={`${process.env.PUBLIC_URL}/assets/images/logo.png`}
          alt="Logo"
        />
      </div>
      <div className="vertical-line"></div>
      <div className="login-container">
        <form className="login-form" onSubmit={handleSubmit}>
          <h2>로그인</h2>
          {error && <p className="error">{error}</p>}
          <input
            type="text"
            placeholder="아이디"
            value={매장명}
            onChange={(e) => set매장명(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={매장_비밀번호}
            onChange={(e) => set매장_비밀번호(e.target.value)}
            required
          />
          <button type="submit">로그인</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
