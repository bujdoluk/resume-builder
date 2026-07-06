"use client";

import { useState } from "react";

const sections = ["Personal Info", "Experience", "Education", "Skills"];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="drawer-side">
      <label
        htmlFor="sidebar-drawer"
        aria-label="Close sidebar"
        className="drawer-overlay"
      ></label>

      <div
        className={`bg-base-100 border-base-300 flex min-h-full flex-col border-r transition-[width] duration-200 ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        <div
          className={`hidden p-2 lg:flex ${collapsed ? "justify-center" : "justify-end"}`}
        >
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="btn btn-square btn-ghost btn-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className={`h-5 w-5 stroke-current transition-transform ${
                collapsed ? "rotate-180" : ""
              }`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        </div>

        <ul className="menu w-full flex-1 flex-nowrap p-4 pt-0">
          {!collapsed && <li className="menu-title">Sections</li>}
          {sections.map((section) => (
            <li key={section}>
              <a title={collapsed ? section : undefined}>
                {collapsed ? section.charAt(0) : section}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
