import { useState } from "react";

export default function Header() {
  return (
    <header>
      <div className="navbar bg-base-100 shadow-sm">
        <div className="flex-1">
          <a className="btn btn-ghost text-xl">MealMate</a>
        </div>

        <div className="btn">LogIn</div>
        <div className="btn btn-primary">SignUp</div>
      </div>
    </header>
  );
}
