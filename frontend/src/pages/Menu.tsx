import { useState } from "react";
import { type MenuProps } from "./MenuProps"

export default function Menu( { onMenu }: MenuProps) {
    const [name, setName] = useState("");

    function handleMenu () {
		if (name.trim() === "")
			return;

		onMenu(name);
    };

     return (
    <div className="menu-container" style={{ maxWidth: "400px", margin: "50px auto", textAlign: "center" }}>
      <h2>Menu</h2>
      
      <form onSubmit={handleMenu} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

        <input
          placeholder="Type your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        

        <button type="submit">
          Start game
        </button>
      </form>
    </div>
  );
}