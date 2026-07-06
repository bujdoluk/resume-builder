"use client";

import { useState } from "react";
import { sectionLabels, type SectionKey } from "@/components/Resume";

const sections = ["Personal Info", "Experience", "Education", "Skills"];

interface SidebarProps {
  hiddenSections: SectionKey[];
  onAddSection: (key: SectionKey) => void;
}

export default function Sidebar({
  hiddenSections,
  onAddSection,
}: SidebarProps) {
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

        <ul className="menu w-full flex-nowrap p-4 pt-0">
          {!collapsed && <li className="menu-title">Sections</li>}
          {sections.map((section) => (
            <li key={section}>
              <a title={collapsed ? section : undefined}>
                {collapsed ? section.charAt(0) : section}
              </a>
            </li>
          ))}
        </ul>

        {hiddenSections.length > 0 && !collapsed && (
          <div className="border-base-300 flex-1 border-t p-4">
            <p className="mb-2 text-xs font-semibold text-gray-400 uppercase">
              Add Section
            </p>
            <div className="flex flex-col gap-1">
              {hiddenSections.map((key) => (
                <button
                  key={key}
                  type="button"
                  className="btn btn-outline btn-xs justify-start"
                  onClick={() => onAddSection(key)}
                >
                  + {sectionLabels[key]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
