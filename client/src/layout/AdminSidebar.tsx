"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "@/context/AuthContext";
import {
  BoxCubeIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  PageIcon,
  UserCircleIcon,
  DollarLineIcon,
  DocsIcon,
  GroupIcon,
} from "../icons/index";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  permission?: string | string[]; // Permission(s) required to see this item
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean; permission?: string | string[] }[];
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/admin",
    permission: 'view_dashboard',
  },
  {
    icon: <UserCircleIcon />,
    name: "Employees",
    path: "/admin/employees",
    permission: 'manage_users',
    subItems: [
      { name: "Employees List", path: "/admin/employees", permission: 'manage_users' },
      { name: "Create Employee", path: "/admin/employees/new", permission: 'manage_users' },
    ],
  },
  {
    icon: <UserCircleIcon />,
    name: "Roles",
    path: "/admin/roles",
    permission: 'manage_roles',
    subItems: [
      { name: "Roles List", path: "/admin/roles", permission: 'manage_roles' },
      { name: "Create Role", path: "/admin/roles/new", permission: 'manage_roles' },
    ],
  },
  {
    icon: <GroupIcon />,
    name: "Sellers",
    path: "/admin/sellers",
    permission: 'view_users',
  },
  {
    icon: <BoxCubeIcon />,
    name: "Products",
    path: "/admin/products",
    permission: ['view_products', 'manage_products'],
    subItems: [
      { name: "Products List", path: "/admin/products", permission: 'view_products' },
      { name: "Add Product", path: "/admin/products/new", permission: 'manage_products' },
      { name: "Design Library", path: "/admin/design-assets", permission: 'manage_products' },
    ],
  },
  {
    icon: <PageIcon />,
    name: "Templates",
    path: "/admin/templates",
    permission: ['view_templates', 'manage_templates', 'approve_templates'],
  },
  {
    icon: <ListIcon />,
    name: "Orders",
    path: "/admin/orders",
    permission: ['view_orders', 'manage_orders'],
  },
  {
    icon: <BoxCubeIcon />,
    name: "Returns",
    path: "/admin/returns",
    permission: ['view_orders', 'manage_orders'],
  },
  {
    icon: <DollarLineIcon />,
    name: "Transactions",
    path: "/admin/transactions",
    permission: 'view_transactions',
  },
  {
    icon: <DocsIcon />,
    name: "Configuration",
    path: "/admin/configuration",
    permission: 'configure_site',
  },
  {
    icon: <UserCircleIcon />,
    name: "Profile",
    path: "/admin/profile",
    // Profile doesn't need permission, everyone can see their own
  },
];

const AdminSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { isAdmin, isEmployee, hasPermission } = useAuth();

  // Check if user can view a nav item based on permissions
  const canViewNav = (nav: NavItem): boolean => {
    // Admin sees everything
    if (isAdmin) return true;
    
    // If no permission required, restrict to admins only (except Profile)
    if (!nav.permission) {
      return nav.name === 'Profile'; // Everyone can see profile
    }
    
    // Check permission(s)
    if (typeof nav.permission === 'string') {
      return hasPermission(nav.permission);
    }
    
    // Permission is array - user needs at least one
    return nav.permission.some((p) => hasPermission(p));
  };

  // Check if user can view a sub item
  const canViewSubItem = (subItem: NavItem['subItems'][0]): boolean => {
    if (!subItem.permission) return true; // No permission = visible
    
    if (typeof subItem.permission === 'string') {
      return hasPermission(subItem.permission);
    }
    
    return subItem.permission.some((p) => hasPermission(p));
  };

  const pathname = usePathname();

  const renderMenuItems = (
    navItems: NavItem[],
    menuType: "main" | "others"
  ) => (
    <ul className="flex flex-col gap-4">
      {navItems
        .filter((nav) => canViewNav(nav)) // Filter based on permissions
        .map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group  ${openSubmenu?.type === menuType && openSubmenu?.index === index
                ? "menu-item-active"
                : "menu-item-inactive"
                } cursor-pointer ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
                }`}
            >
              <span
                className={` ${openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-icon-active"
                  : "menu-item-icon-inactive"
                  }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className={`menu-item-text`}>{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200  ${openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                    ? "rotate-180 text-brand-500"
                    : ""
                    }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                  }`}
              >
                <span
                  className={`${isActive(nav.path)
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                    }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className={`menu-item-text`}>{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems
                  .filter((subItem) => canViewSubItem(subItem)) // Filter sub items too
                  .map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      className={`menu-dropdown-item ${isActive(subItem.path)
                        ? "menu-dropdown-item-active"
                        : "menu-dropdown-item-inactive"
                        }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${isActive(subItem.path)
                              ? "menu-dropdown-badge-active"
                              : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge `}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${isActive(subItem.path)
                              ? "menu-dropdown-badge-active"
                              : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge `}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  useEffect(() => {
    // Check if the current path matches any submenu item
    let submenuMatched = false;
    ["main"].forEach((menuType) => {
      const items = navItems.filter(canViewNav);
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    // If no submenu item matches, close the open submenu
    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname, isActive]);

  useEffect(() => {
    // Set the height of the submenu items when the submenu is opened
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex  ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
          }`}
      >
        <Link href="/admin">
          {isExpanded || isHovered || isMobileOpen ? (
            <div className="flex items-center space-x-2">
              <Image
                src="/images/podnitlogo.png"
                alt="Podnit Logo"
                width={32}
                height={32}
              />
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Podnit
              </span>
            </div>
          ) : (
            <Image
              src="/images/podnitlogo.png"
              alt="Podnit Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "justify-start"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  isAdmin ? "Admin Menu" : "Staff Menu"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(navItems.filter(canViewNav), "main")}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AdminSidebar;
