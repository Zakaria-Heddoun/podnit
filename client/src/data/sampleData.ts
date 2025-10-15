// Sample data for DataTable components
import { User, Product, Order, Return } from "@/types/datatable";

// Sample user data with projects and teams
export const sampleUsers: User[] = [
  {
    id: 1,
    user: {
      image: "/images/user/user-17.jpg",
      name: "Lindsey Curtis",
      role: "Web Designer",
    },
    projectName: "Agency Website",
    team: {
      images: [
        "/images/user/user-22.jpg",
        "/images/user/user-23.jpg",
        "/images/user/user-24.jpg",
      ],
    },
    budget: "3.9K",
    status: "Active",
    createdAt: "2024-01-15",
    updatedAt: "2024-01-20",
  },
  {
    id: 2,
    user: {
      image: "/images/user/user-18.jpg",
      name: "Kaiya George",
      role: "Project Manager",
    },
    projectName: "Technology Platform",
    team: {
      images: ["/images/user/user-25.jpg", "/images/user/user-26.jpg"],
    },
    budget: "24.9K",
    status: "Pending",
    createdAt: "2024-01-10",
    updatedAt: "2024-01-18",
  },
  {
    id: 3,
    user: {
      image: "/images/user/user-17.jpg",
      name: "Zain Geidt",
      role: "Content Writer",
    },
    projectName: "Blog Writing",
    team: {
      images: ["/images/user/user-27.jpg"],
    },
    budget: "12.7K",
    status: "Active",
    createdAt: "2024-01-12",
    updatedAt: "2024-01-19",
  },
  {
    id: 4,
    user: {
      image: "/images/user/user-20.jpg",
      name: "Abram Schleifer",
      role: "Digital Marketer",
    },
    projectName: "Social Media Campaign",
    team: {
      images: [
        "/images/user/user-28.jpg",
        "/images/user/user-29.jpg",
        "/images/user/user-30.jpg",
      ],
    },
    budget: "2.8K",
    status: "Cancel",
    createdAt: "2024-01-08",
    updatedAt: "2024-01-16",
  },
  {
    id: 5,
    user: {
      image: "/images/user/user-21.jpg",
      name: "Carla George",
      role: "Frontend Developer",
    },
    projectName: "E-commerce Website",
    team: {
      images: [
        "/images/user/user-31.jpg",
        "/images/user/user-32.jpg",
        "/images/user/user-33.jpg",
      ],
    },
    budget: "4.5K",
    status: "Active",
    createdAt: "2024-01-14",
    updatedAt: "2024-01-21",
  },
  {
    id: 6,
    user: {
      image: "/images/user/user-19.jpg",
      name: "John Smith",
      role: "Backend Developer",
    },
    projectName: "API Development",
    team: {
      images: [
        "/images/user/user-34.jpg",
        "/images/user/user-35.jpg",
      ],
    },
    budget: "18.2K",
    status: "Active",
    createdAt: "2024-01-11",
    updatedAt: "2024-01-22",
  },
  {
    id: 7,
    user: {
      image: "/images/user/user-22.jpg",
      name: "Sarah Johnson",
      role: "UI/UX Designer",
    },
    projectName: "Mobile App Design",
    team: {
      images: [
        "/images/user/user-36.jpg",
        "/images/user/user-37.jpg",
        "/images/user/user-38.jpg",
        "/images/user/user-39.jpg",
      ],
    },
    budget: "7.1K",
    status: "Pending",
    createdAt: "2024-01-09",
    updatedAt: "2024-01-17",
  },
  {
    id: 8,
    user: {
      image: "/images/user/user-23.jpg",
      name: "Mike Wilson",
      role: "DevOps Engineer",
    },
    projectName: "Cloud Infrastructure",
    team: {
      images: ["/images/user/user-40.jpg"],
    },
    budget: "15.8K",
    status: "Active",
    createdAt: "2024-01-13",
    updatedAt: "2024-01-20",
  },
  {
    id: 9,
    user: {
      image: "/images/user/user-24.jpg",
      name: "Emily Davis",
      role: "Data Analyst",
    },
    projectName: "Analytics Dashboard",
    team: {
      images: [
        "/images/user/user-41.jpg",
        "/images/user/user-42.jpg",
      ],
    },
    budget: "9.3K",
    status: "Cancel",
    createdAt: "2024-01-07",
    updatedAt: "2024-01-15",
  },
  {
    id: 10,
    user: {
      image: "/images/user/user-25.jpg",
      name: "David Brown",
      role: "Product Manager",
    },
    projectName: "Product Roadmap",
    team: {
      images: [
        "/images/user/user-43.jpg",
        "/images/user/user-44.jpg",
        "/images/user/user-45.jpg",
      ],
    },
    budget: "22.5K",
    status: "Active",
    createdAt: "2024-01-16",
    updatedAt: "2024-01-23",
  },
  {
    id: 11,
    user: {
      image: "/images/user/user-26.jpg",
      name: "Lisa Anderson",
      role: "QA Engineer",
    },
    projectName: "Testing Framework",
    team: {
      images: [
        "/images/user/user-46.jpg",
        "/images/user/user-47.jpg",
      ],
    },
    budget: "6.8K",
    status: "Pending",
    createdAt: "2024-01-18",
    updatedAt: "2024-01-24",
  },
  {
    id: 12,
    user: {
      image: "/images/user/user-27.jpg",
      name: "Robert Taylor",
      role: "Security Specialist",
    },
    projectName: "Security Audit",
    team: {
      images: ["/images/user/user-48.jpg"],
    },
    budget: "11.2K",
    status: "Active",
    createdAt: "2024-01-19",
    updatedAt: "2024-01-25",
  },
];

// Sample return data
export const sampleReturns: Return[] = [
  {
    id: 1,
    returnNumber: "RET-001",
    customer: {
      name: "John Doe",
      email: "john.doe@example.com",
      avatar: "/images/user/user-01.jpg",
    },
    product: "MacBook Pro 13\"",
    amount: 2399.00,
    status: "Approved",
    date: "2024-01-22",
    reason: "Defective product",
  },
  {
    id: 2,
    returnNumber: "RET-002",
    customer: {
      name: "Jane Smith",
      email: "jane.smith@example.com",
      avatar: "/images/user/user-02.jpg",
    },
    product: "iPhone 15 Pro Max",
    amount: 1869.00,
    status: "Pending",
    date: "2024-01-21",
    reason: "Changed mind",
  },
  {
    id: 3,
    returnNumber: "RET-003",
    customer: {
      name: "Mike Johnson",
      email: "mike.johnson@example.com",
      avatar: "/images/user/user-03.jpg",
    },
    product: "Apple Watch Ultra",
    amount: 879.00,
    status: "Rejected",
    date: "2024-01-20",
    reason: "Outside return window",
  },
  {
    id: 4,
    returnNumber: "RET-004",
    customer: {
      name: "Sarah Wilson",
      email: "sarah.wilson@example.com",
      avatar: "/images/user/user-04.jpg",
    },
    product: "AirPods Pro 2nd Gen",
    amount: 240.00,
    status: "Approved",
    date: "2024-01-19",
    reason: "Not as described",
  },
  {
    id: 5,
    returnNumber: "RET-005",
    customer: {
      name: "David Brown",
      email: "david.brown@example.com",
      avatar: "/images/user/user-05.jpg",
    },
    product: "iPad Pro 3rd Gen",
    amount: 1699.00,
    status: "Refunded",
    date: "2024-01-18",
    reason: "Damaged during shipping",
  },
  {
    id: 6,
    returnNumber: "RET-006",
    customer: {
      name: "Emily Davis",
      email: "emily.davis@example.com",
      avatar: "/images/user/user-06.jpg",
    },
    product: "MacBook Air M2",
    amount: 1199.00,
    status: "Pending",
    date: "2024-01-17",
    reason: "Performance issues",
  },
  {
    id: 7,
    returnNumber: "RET-007",
    customer: {
      name: "Robert Taylor",
      email: "robert.taylor@example.com",
      avatar: "/images/user/user-07.jpg",
    },
    product: "Apple TV 4K",
    amount: 179.00,
    status: "Approved",
    date: "2024-01-16",
    reason: "Duplicate order",
  },
];

// Sample product data
export const sampleProducts: Product[] = [
  {
    id: 1,
    name: "MacBook Pro 13\"",
    variants: "2 Variants",
    category: "Laptop",
    price: "2399.00",
    status: "Delivered",
    image: "/images/product/product-01.jpg",
    stock: 15,
    rating: 4.8,
    orderCount: 23,
  },
  {
    id: 2,
    name: "Apple Watch Ultra",
    variants: "1 Variant",
    category: "Watch",
    price: "879.00",
    status: "Pending",
    image: "/images/product/product-02.jpg",
    stock: 8,
    rating: 4.6,
    orderCount: 15,
  },
  {
    id: 3,
    name: "iPhone 15 Pro Max",
    variants: "2 Variants",
    category: "SmartPhone",
    price: "1869.00",
    status: "Delivered",
    image: "/images/product/product-03.jpg",
    stock: 22,
    rating: 4.9,
    orderCount: 31,
  },
  {
    id: 4,
    name: "iPad Pro 3rd Gen",
    variants: "2 Variants",
    category: "Electronics",
    price: "1699.00",
    status: "Canceled",
    image: "/images/product/product-04.jpg",
    stock: 0,
    rating: 4.7,
    orderCount: 8,
  },
  {
    id: 5,
    name: "AirPods Pro 2nd Gen",
    variants: "1 Variant",
    category: "Accessories",
    price: "240.00",
    status: "Delivered",
    image: "/images/product/product-05.jpg",
    stock: 45,
    rating: 4.5,
    orderCount: 42,
  },
  {
    id: 6,
    name: "Samsung Galaxy S24",
    variants: "3 Variants",
    category: "SmartPhone",
    price: "1299.00",
    status: "Pending",
    image: "/images/product/product-06.jpg",
    stock: 12,
    rating: 4.4,
    orderCount: 19,
  },
  {
    id: 7,
    name: "Dell XPS 15",
    variants: "2 Variants",
    category: "Laptop",
    price: "1899.00",
    status: "Delivered",
    image: "/images/product/product-07.jpg",
    stock: 7,
    rating: 4.6,
    orderCount: 12,
  },
  {
    id: 8,
    name: "Sony WH-1000XM5",
    variants: "1 Variant",
    category: "Accessories",
    price: "399.00",
    status: "Delivered",
    image: "/images/product/product-08.jpg",
    stock: 18,
    rating: 4.8,
    orderCount: 27,
  },
];

// Sample order data
export const sampleOrders: Order[] = [
  {
    id: 1,
    orderNumber: "ORD-001",
    customer: {
      name: "John Doe",
      email: "john.doe@example.com",
      avatar: "/images/user/user-01.jpg",
    },
    product: "MacBook Pro 13\"",
    amount: 2399.00,
    status: "Completed",
    date: "2024-01-20",
    paymentMethod: "Credit Card",
  },
  {
    id: 2,
    orderNumber: "ORD-002",
    customer: {
      name: "Jane Smith",
      email: "jane.smith@example.com",
      avatar: "/images/user/user-02.jpg",
    },
    product: "iPhone 15 Pro Max",
    amount: 1869.00,
    status: "Processing",
    date: "2024-01-19",
    paymentMethod: "PayPal",
  },
  {
    id: 3,
    orderNumber: "ORD-003",
    customer: {
      name: "Mike Johnson",
      email: "mike.johnson@example.com",
      avatar: "/images/user/user-03.jpg",
    },
    product: "Apple Watch Ultra",
    amount: 879.00,
    status: "Cancelled",
    date: "2024-01-18",
    paymentMethod: "Bank Transfer",
  },
  {
    id: 4,
    orderNumber: "ORD-004",
    customer: {
      name: "Sarah Wilson",
      email: "sarah.wilson@example.com",
      avatar: "/images/user/user-04.jpg",
    },
    product: "AirPods Pro 2nd Gen",
    amount: 240.00,
    status: "Completed",
    date: "2024-01-17",
    paymentMethod: "Credit Card",
  },
  {
    id: 5,
    orderNumber: "ORD-005",
    customer: {
      name: "David Brown",
      email: "david.brown@example.com",
      avatar: "/images/user/user-05.jpg",
    },
    product: "iPad Pro 3rd Gen",
    amount: 1699.00,
    status: "Refunded",
    date: "2024-01-16",
    paymentMethod: "Credit Card",
  },
];

// Utility functions for generating more sample data
export const generateRandomUser = (id: number): User => {
  const names = [
    "Alice Cooper", "Bob Martin", "Charlie Davis", "Diana Prince", "Edward Norton",
    "Fiona Green", "George Lucas", "Helen Troy", "Ian Fleming", "Julia Roberts"
  ];
  const roles = [
    "Frontend Developer", "Backend Developer", "UI/UX Designer", "Product Manager",
    "Data Analyst", "DevOps Engineer", "QA Engineer", "Content Writer"
  ];
  const projects = [
    "Web Application", "Mobile App", "Dashboard", "E-commerce Site", "Blog Platform",
    "Analytics Tool", "CRM System", "Marketing Campaign"
  ];
  const statuses: ("Active" | "Pending" | "Cancel")[] = ["Active", "Pending", "Cancel"];

  return {
    id,
    user: {
      image: `/images/user/user-${(id % 10) + 1}.jpg`,
      name: names[id % names.length],
      role: roles[id % roles.length],
    },
    projectName: projects[id % projects.length],
    team: {
      images: Array.from({ length: Math.floor(Math.random() * 4) + 1 }, (_, i) => 
        `/images/user/user-${((id + i) % 50) + 1}.jpg`
      ),
    },
    budget: `${(Math.random() * 50 + 1).toFixed(1)}K`,
    status: statuses[id % statuses.length],
    createdAt: new Date(2024, 0, (id % 30) + 1).toISOString().split('T')[0],
    updatedAt: new Date(2024, 0, (id % 30) + 5).toISOString().split('T')[0],
  };
};

export const generateSampleUsers = (count: number): User[] => {
  return Array.from({ length: count }, (_, i) => generateRandomUser(i + 1));
};