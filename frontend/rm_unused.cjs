const fs = require('fs');

function replace(file, src, dest) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(src, dest);
    fs.writeFileSync(file, content, 'utf8');
  }
}

function replaceAll(file, src, dest) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(new RegExp(src, 'g'), dest);
    fs.writeFileSync(file, content, 'utf8');
  }
}

// 1. ChatButton.jsx
replace('src/Components/ChatButton.jsx', /\{ onClick \}/, '{}');

// 2. Header.jsx
replaceAll('src/features/customer/components/Header.jsx', /import React, \{ useState \} from 'react';/, "import React from 'react';");

// 3. RestaurantCard.jsx
replaceAll('src/features/customer/components/cards/RestaurantCard.jsx', /import \{ useNavigate \} from 'react-router-dom';\s*/, '');
replaceAll('src/features/customer/components/cards/RestaurantCard.jsx', /const navigate = useNavigate\(\);\s*/, '');

// 4. Navbar.jsx (skeleton)
replaceAll('src/features/customer/components/skeleton/Navbar.jsx', /import \{ axiosInstance \} from "\.\.\/\.\.\/\.\.\/lib\/axios";\s*/, '');
replaceAll('src/features/customer/components/skeleton/Navbar.jsx', /import toast from "react-hot-toast";\s*/, '');

// 5. userAuthStore.js
replaceAll('src/features/customer/store/userAuthStore.js', /import \{ axiosInstance, data \} from "\.\.\/\.\.\/\.\.\/lib\/axios";/, 'import { axiosInstance } from "../../../lib/axios";');
replaceAll('src/features/customer/store/userAuthStore.js', /import axios from "axios";\s*/, '');
replaceAll('src/features/customer/store/userAuthStore.js', /const \{ data \} = await axiosInstance\.post\("\/customer\/logout"\);/, 'await axiosInstance.post("/customer/logout");');

// 6. AddMenuItemRest.jsx
replaceAll('src/features/restaurant/components/AddMenuItemRest.jsx', /import React, \{ useState, useEffect \} from 'react';/, "import React, { useState } from 'react';");

// 7. AnalyticsRest.jsx
replaceAll('src/features/restaurant/components/AnalyticsRest.jsx', /const \{ analytics, loading \} = useRestaurantStore\(\);/, 'const { analytics } = useRestaurantStore();');

// 8. HeaderRest.jsx
replaceAll('src/features/restaurant/components/HeaderRest.jsx', /import \{ useNavigate \} from 'react-router-dom';\s*/, '');
replaceAll('src/features/restaurant/components/HeaderRest.jsx', /const navigate = useNavigate\(\);\s*/, '');
replaceAll('src/features/restaurant/components/HeaderRest.jsx', /const clearNotifications = \(\) => \{[\s\S]*?\};\s*/, '');

// 9. LoginPageRest.jsx
replaceAll('src/features/restaurant/components/LoginPageRest.jsx', /import \{ useNavigate \} from 'react-router-dom';\s*/, '');
replaceAll('src/features/restaurant/components/LoginPageRest.jsx', /const navigate = useNavigate\(\);\s*/, '');
replaceAll('src/features/restaurant/components/LoginPageRest.jsx', /const \{ authRestaurant, isLoading, login, error \} = useRestaurantAuthStore\(\);/, 'const { login, error } = useRestaurantAuthStore();');

// 10. MenuManagementRest.jsx
replaceAll('src/features/restaurant/components/MenuManagementRest.jsx', /const updatedItem = await edit_menu\(editingItem\._id, submitData\);/, 'await edit_menu(editingItem._id, submitData);');

// 11. LoginPageRider.jsx
replaceAll('src/features/rider/pages/LoginPageRider.jsx', /const \[showPassword, setShowPassword\] = useState\(false\);\s*/, '');
replaceAll('src/features/rider/pages/LoginPageRider.jsx', /setShowPassword\(\(prev\) => !prev\)/, 'null'); 
// Need to add const showPassword = false; to prevent undefined
let lr = 'src/features/rider/pages/LoginPageRider.jsx';
if (fs.existsSync(lr)) {
  let lrc = fs.readFileSync(lr, 'utf8');
  if(!lrc.includes('const showPassword = false;')) {
     lrc = lrc.replace(/const \[email, setEmail\] = useState\(""\);/, 'const showPassword = false;\n  const [email, setEmail] = useState("");');
     fs.writeFileSync(lr, lrc, 'utf8');
  }
}

// 12. HomePage.jsx
let hp = 'src/features/customer/pages/HomePage.jsx';
if (fs.existsSync(hp)) {
  let hpc = fs.readFileSync(hp, 'utf8');
  hpc = hpc.replace(/const \{ categories, getcategories \} = useCustomerStore\(\);/, 'const { getcategories } = useCustomerStore();');
  hpc = hpc.replace(/const \{ user, logout \} = useAuthStore\(\);/, 'const { logout } = useAuthStore();');
  fs.writeFileSync(hp, hpc, 'utf8');
}

// 13. LoginPage.jsx
let cLogin = 'src/features/customer/pages/LoginPage.jsx';
if (fs.existsSync(cLogin)) {
  let clc = fs.readFileSync(cLogin, 'utf8');
  clc = clc.replace(/const \[showPassword, setShowPassword\] = useState\(false\);\s*/, '');
  if(!clc.includes('const showPassword = false;')) {
    clc = clc.replace(/const \[email, setEmail\] = useState\(""\);/, 'const showPassword = false;\n  const [email, setEmail] = useState("");');
    clc = clc.replace(/setShowPassword\(\(prev\) => !prev\)/, 'null');
    fs.writeFileSync(cLogin, clc, 'utf8');
  }
}

// 14. RestaurantProfile.jsx (customer)
let cProfile = 'src/features/customer/pages/RestaurantProfile.jsx';
if (fs.existsSync(cProfile)) {
  let cpc = fs.readFileSync(cProfile, 'utf8');
  cpc = cpc.replace(/import React, \{ useState, useEffect, useCallback \} from 'react';/, "import React, { useState, useEffect } from 'react';");
  cpc = cpc.replace(/const \[activeCategory, setActiveCategory\] = useState\(''\);\s*/, '');
  cpc = cpc.replace(/const navigate = useNavigate\(\);\s*/, '');
  cpc = cpc.replace(/const \[isDarkMode, setDarkMode\] = useState\(false\);\s*/, '');
  fs.writeFileSync(cProfile, cpc, 'utf8');
}

// 15. SimulatePaymentGateway.jsx
replaceAll('src/features/customer/pages/SimulatePaymentGateway.jsx', /const navigate = useNavigate\(\);\s*/, '');

// 16. notificationStore.js
replaceAll('src/features/customer/store/notificationStore.js', /create\(\(set, get\) => \(\{/, 'create((set) => ({');

// 17. RestaurantProfile.jsx (restaurant)
replaceAll('src/features/restaurant/components/RestaurantProfile.jsx', /import React, \{ useState, useEffect \} from "react";/, 'import React, { useState } from "react";');
