import React from "react";
import StoreList from "./components/StoreList";
import AddStore from "./components/AddStore";

function App() {
    return (
        <div>
            <h1>카페 발주 시스템</h1>
            <AddStore />
            <StoreList />
        </div>
    );
}

export default App;
