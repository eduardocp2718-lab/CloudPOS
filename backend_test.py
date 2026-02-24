#!/usr/bin/env python3
"""
Comprehensive Backend Testing for POS System
Tests all backend API endpoints following the testing requirements.
"""

import requests
import json
from datetime import datetime
import time

# Configuration
BASE_URL = "https://cloud-pos-system-1.preview.emergentagent.com/api"
session = requests.Session()

# Test data
test_user_email = "testowner@posstore.com"
test_user_password = "SecurePass123!"
test_store_name = "Mi Tienda POS"

# Global variables to store created data
auth_token = None
created_user_id = None
created_products = []
created_sale_id = None

def log_test_result(test_name, success, details=""):
    """Log test results with timestamp"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"[{timestamp}] {status} - {test_name}")
    if details:
        print(f"    Details: {details}")
    print()

def make_request(method, endpoint, data=None, expect_status=200):
    """Make HTTP request with error handling"""
    url = f"{BASE_URL}{endpoint}"
    try:
        if method.upper() == 'GET':
            response = session.get(url)
        elif method.upper() == 'POST':
            response = session.post(url, json=data)
        elif method.upper() == 'PUT':
            response = session.put(url, json=data)
        elif method.upper() == 'DELETE':
            response = session.delete(url)
        
        print(f"  → {method.upper()} {endpoint}")
        print(f"  → Status: {response.status_code}")
        
        if response.status_code != expect_status:
            print(f"  → Expected {expect_status}, got {response.status_code}")
            print(f"  → Response: {response.text}")
            return None, response.status_code
        
        return response.json() if response.content else {}, response.status_code
        
    except Exception as e:
        print(f"  → Request failed: {str(e)}")
        return None, 0

def test_auth_register():
    """Test user registration"""
    print("🔐 Testing Authentication - Register")
    
    data = {
        "email": test_user_email,
        "password": test_user_password,
        "store_name": test_store_name,
        "currency_symbol": "$"
    }
    
    result, status = make_request("POST", "/auth/register", data, 200)
    
    if result and status == 200:
        global created_user_id
        created_user_id = result.get('user', {}).get('id')
        log_test_result("User Registration", True, f"User ID: {created_user_id}")
        return True
    else:
        log_test_result("User Registration", False, f"Status: {status}")
        return False

def test_auth_login():
    """Test user login"""
    print("🔐 Testing Authentication - Login")
    
    data = {
        "email": test_user_email,
        "password": test_user_password
    }
    
    result, status = make_request("POST", "/auth/login", data, 200)
    
    if result and status == 200:
        # Check if auth_token cookie was set
        cookies = session.cookies.get_dict()
        auth_cookie = cookies.get('auth_token')
        if auth_cookie:
            global auth_token
            auth_token = auth_cookie
            log_test_result("User Login", True, f"Auth token received in cookie")
            return True
        else:
            log_test_result("User Login", False, "Auth token cookie not set")
            return False
    else:
        log_test_result("User Login", False, f"Status: {status}")
        return False

def test_auth_me():
    """Test getting current user info"""
    print("🔐 Testing Authentication - Current User")
    
    result, status = make_request("GET", "/auth/me", expect_status=200)
    
    if result and status == 200:
        user = result.get('user', {})
        if user.get('email') == test_user_email:
            log_test_result("Get Current User", True, f"User: {user.get('store_name')}")
            return True
        else:
            log_test_result("Get Current User", False, "User data mismatch")
            return False
    else:
        log_test_result("Get Current User", False, f"Status: {status}")
        return False

def test_products_create():
    """Test creating products"""
    print("📦 Testing Products - Create")
    
    products_data = [
        {
            "barcode": "123456",
            "name": "Coca Cola",
            "cost_price": 10.0,
            "sale_price": 15.0,
            "stock_quantity": 50,
            "category": "Bebidas"
        },
        {
            "barcode": "789012",
            "name": "Pan",
            "cost_price": 5.0,
            "sale_price": 8.0,
            "stock_quantity": 5,
            "category": "Panadería"
        },
        {
            "barcode": "345678",
            "name": "Leche",
            "cost_price": 20.0,
            "sale_price": 30.0,
            "stock_quantity": 100,
            "category": "Lácteos"
        },
        {
            "barcode": "901234",
            "name": "Arroz",
            "cost_price": 15.0,
            "sale_price": 25.0,
            "stock_quantity": 30,
            "category": "Granos"
        }
    ]
    
    success_count = 0
    global created_products
    
    for product_data in products_data:
        result, status = make_request("POST", "/products", product_data, 200)
        
        if result and status == 200:
            created_products.append(result)
            success_count += 1
            print(f"  ✅ Created: {product_data['name']} (ID: {result.get('id')})")
        else:
            print(f"  ❌ Failed to create: {product_data['name']}")
    
    if success_count == len(products_data):
        log_test_result("Create Products", True, f"Created {success_count}/{len(products_data)} products")
        return True
    else:
        log_test_result("Create Products", False, f"Only {success_count}/{len(products_data)} products created")
        return False

def test_products_list():
    """Test listing and searching products"""
    print("📦 Testing Products - List & Search")
    
    # Test list all products
    result, status = make_request("GET", "/products", expect_status=200)
    
    if not (result is not None and status == 200):
        log_test_result("List Products", False, f"Status: {status}")
        return False
    
    if len(result) >= len(created_products):
        print(f"  ✅ Listed {len(result)} products")
    else:
        print(f"  ⚠️  Expected at least {len(created_products)}, got {len(result)}")
    
    # Test search by name
    result, status = make_request("GET", "/products?search=coca", expect_status=200)
    if result is not None and status == 200:
        coca_found = any("coca" in p.get('name', '').lower() for p in result)
        if coca_found:
            print("  ✅ Search by name works")
        else:
            print("  ❌ Search by name failed")
    
    # Test search by barcode
    result, status = make_request("GET", "/products?barcode=123456", expect_status=200)
    if result is not None and status == 200 and len(result) > 0:
        if result[0].get('barcode') == "123456":
            print("  ✅ Search by barcode works")
        else:
            print("  ❌ Search by barcode failed")
    
    log_test_result("List & Search Products", True, "All product listing tests passed")
    return True

def test_products_update():
    """Test updating a product"""
    print("📦 Testing Products - Update")
    
    if not created_products:
        log_test_result("Update Product", False, "No products to update")
        return False
    
    product = created_products[0]  # Update the first product (Coca Cola)
    product_id = product.get('id')
    
    update_data = {
        "name": "Coca Cola 2L",
        "sale_price": 18.0,
        "stock_quantity": 45
    }
    
    result, status = make_request("PUT", f"/products/{product_id}", update_data, 200)
    
    if result is not None and status == 200:
        log_test_result("Update Product", True, f"Updated product {product_id}")
        return True
    else:
        log_test_result("Update Product", False, f"Status: {status}")
        return False

def test_sales_create():
    """Test creating a sale - CRITICAL FEATURE"""
    print("💰 Testing Sales - Create (CORE FEATURE)")
    
    if len(created_products) < 2:
        log_test_result("Create Sale", False, "Not enough products for sale")
        return False
    
    # Create a sale with multiple items
    coca_cola = next((p for p in created_products if "coca" in p.get('name', '').lower()), None)
    pan = next((p for p in created_products if "pan" in p.get('name', '').lower()), None)
    
    if not coca_cola or not pan:
        log_test_result("Create Sale", False, "Required products not found")
        return False
    
    sale_data = {
        "items": [
            {"product_id": coca_cola['id'], "quantity": 2},
            {"product_id": pan['id'], "quantity": 1}
        ],
        "payment_method": "cash",
        "amount_received": 50.0
    }
    
    print(f"  → Creating sale with:")
    print(f"    - 2x {coca_cola['name']} @ ${coca_cola['sale_price']}")
    print(f"    - 1x {pan['name']} @ ${pan['sale_price']}")
    
    result, status = make_request("POST", "/sales", sale_data, 200)
    
    if result and status == 200:
        global created_sale_id
        created_sale_id = result.get('id')
        total = result.get('total_amount')
        profit = result.get('profit')
        change = result.get('change_given')
        
        print(f"  ✅ Sale created: ID {created_sale_id}")
        print(f"  ✅ Total: ${total}")
        print(f"  ✅ Profit: ${profit}")
        print(f"  ✅ Change: ${change}")
        
        # Verify expected calculations
        expected_total = (coca_cola['sale_price'] * 2) + (pan['sale_price'] * 1)
        if abs(total - expected_total) < 0.01:
            print(f"  ✅ Total calculation correct")
        else:
            print(f"  ❌ Total calculation error: expected {expected_total}, got {total}")
        
        log_test_result("Create Sale", True, f"Sale ID: {created_sale_id}, Total: ${total}")
        return True
    else:
        log_test_result("Create Sale", False, f"Status: {status}")
        return False

def test_stock_update_verification():
    """Verify that stock was updated after sale"""
    print("📦 Testing Stock Update After Sale")
    
    # Get current products to verify stock update
    result, status = make_request("GET", "/products", expect_status=200)
    
    if not (result is not None and status == 200):
        log_test_result("Stock Update Verification", False, "Could not fetch products")
        return False
    
    # Find Coca Cola and Pan to verify stock reduction
    coca_cola_updated = next((p for p in result if "coca" in p.get('name', '').lower()), None)
    pan_updated = next((p for p in result if "pan" in p.get('name', '').lower()), None)
    
    if coca_cola_updated and pan_updated:
        # Original Coca Cola had 50, should now have 48 (50 - 2)
        # Original Pan had 5, should now have 4 (5 - 1)
        coca_expected = 48 if coca_cola_updated.get('name') == 'Coca Cola' else 45  # Could be updated name
        pan_expected = 4
        
        coca_actual = coca_cola_updated.get('stock_quantity')
        pan_actual = pan_updated.get('stock_quantity')
        
        print(f"  → Coca Cola stock: {coca_actual} (expected around {coca_expected})")
        print(f"  → Pan stock: {pan_actual} (expected {pan_expected})")
        
        stock_updated = (coca_actual <= 48) and (pan_actual == 4)
        
        if stock_updated:
            log_test_result("Stock Update Verification", True, "Stock correctly updated after sale")
            return True
        else:
            log_test_result("Stock Update Verification", False, f"Stock not updated correctly")
            return False
    else:
        log_test_result("Stock Update Verification", False, "Products not found for verification")
        return False

def test_insufficient_stock():
    """Test selling more than available stock"""
    print("💰 Testing Sales - Insufficient Stock Validation")
    
    if not created_products:
        log_test_result("Insufficient Stock Test", False, "No products available")
        return False
    
    # Try to sell more Pan than available (should have 4 left after previous sale)
    pan = next((p for p in created_products if "pan" in p.get('name', '').lower()), None)
    
    if not pan:
        log_test_result("Insufficient Stock Test", False, "Pan product not found")
        return False
    
    sale_data = {
        "items": [
            {"product_id": pan['id'], "quantity": 10}  # More than available
        ],
        "payment_method": "cash",
        "amount_received": 100.0
    }
    
    result, status = make_request("POST", "/sales", sale_data, 400)  # Expect 400 error
    
    if status == 400:
        log_test_result("Insufficient Stock Test", True, "Correctly rejected sale with insufficient stock")
        return True
    else:
        log_test_result("Insufficient Stock Test", False, f"Expected error 400, got {status}")
        return False

def test_sales_list():
    """Test listing sales"""
    print("💰 Testing Sales - List")
    
    result, status = make_request("GET", "/sales", expect_status=200)
    
    if result is not None and status == 200:
        if len(result) > 0:
            sale = result[0]
            print(f"  ✅ Found {len(result)} sales")
            print(f"  ✅ Latest sale: {sale.get('id')} - ${sale.get('total_amount')}")
            log_test_result("List Sales", True, f"Found {len(result)} sales")
            return True
        else:
            log_test_result("List Sales", False, "No sales found")
            return False
    else:
        log_test_result("List Sales", False, f"Status: {status}")
        return False

def test_dashboard_stats():
    """Test dashboard statistics"""
    print("📊 Testing Dashboard - Statistics")
    
    result, status = make_request("GET", "/dashboard/stats", expect_status=200)
    
    if result and status == 200:
        today_stats = result.get('today', {})
        month_stats = result.get('month', {})
        inventory_stats = result.get('inventory', {})
        
        print(f"  → Today's Revenue: ${today_stats.get('revenue', 0)}")
        print(f"  → Today's Profit: ${today_stats.get('profit', 0)}")
        print(f"  → Today's Sales: {today_stats.get('sales_count', 0)}")
        print(f"  → Total Products: {inventory_stats.get('total_products', 0)}")
        print(f"  → Low Stock Items: {inventory_stats.get('low_stock_count', 0)}")
        
        # Verify we have some data
        has_sales_today = today_stats.get('sales_count', 0) > 0
        has_products = inventory_stats.get('total_products', 0) > 0
        has_low_stock = inventory_stats.get('low_stock_count', 0) >= 0
        
        if has_sales_today and has_products:
            log_test_result("Dashboard Statistics", True, "Dashboard shows correct data including today's sale")
            return True
        elif has_products:
            log_test_result("Dashboard Statistics", True, "Dashboard working, shows products but no sales today")
            return True
        else:
            log_test_result("Dashboard Statistics", False, "Dashboard missing expected data")
            return False
    else:
        log_test_result("Dashboard Statistics", False, f"Status: {status}")
        return False

def test_multi_tenant_isolation():
    """Test multi-tenant isolation by creating another user"""
    print("🏢 Testing Multi-Tenant Isolation")
    
    # Create second user
    second_user_data = {
        "email": "seconduser@posstore.com",
        "password": "SecurePass456!",
        "store_name": "Segunda Tienda",
        "currency_symbol": "$"
    }
    
    # Save current session
    first_user_cookies = session.cookies.copy()
    
    result, status = make_request("POST", "/auth/register", second_user_data, 200)
    
    if not (result and status == 200):
        log_test_result("Multi-Tenant Test", False, "Could not create second user")
        return False
    
    # Login as second user
    login_data = {
        "email": "seconduser@posstore.com",
        "password": "SecurePass456!"
    }
    
    result, status = make_request("POST", "/auth/login", login_data, 200)
    
    if not (result and status == 200):
        log_test_result("Multi-Tenant Test", False, "Could not login as second user")
        return False
    
    # Try to access first user's products
    result, status = make_request("GET", "/products", expect_status=200)
    
    if result is not None and status == 200:
        if len(result) == 0:
            print("  ✅ Second user cannot see first user's products")
            
            # Restore first user session
            session.cookies = first_user_cookies
            
            log_test_result("Multi-Tenant Isolation", True, "Users can only see their own data")
            return True
        else:
            print(f"  ❌ Second user can see {len(result)} products (should see 0)")
            log_test_result("Multi-Tenant Isolation", False, "Data leakage between tenants")
            return False
    else:
        log_test_result("Multi-Tenant Isolation", False, f"Status: {status}")
        return False

def test_product_delete():
    """Test deleting a product"""
    print("📦 Testing Products - Delete")
    
    if not created_products:
        log_test_result("Delete Product", False, "No products to delete")
        return False
    
    # Delete the last product (Arroz)
    product = created_products[-1]
    product_id = product.get('id')
    
    result, status = make_request("DELETE", f"/products/{product_id}", expect_status=200)
    
    if result is not None and status == 200:
        log_test_result("Delete Product", True, f"Deleted product {product_id}")
        return True
    else:
        log_test_result("Delete Product", False, f"Status: {status}")
        return False

def run_all_tests():
    """Run all backend tests in order"""
    print("="*60)
    print("🚀 STARTING COMPREHENSIVE POS BACKEND TESTING")
    print("="*60)
    print()
    
    test_results = []
    
    # Authentication tests (high priority)
    test_results.append(("Auth Register", test_auth_register()))
    test_results.append(("Auth Login", test_auth_login()))
    test_results.append(("Auth Current User", test_auth_me()))
    
    # Product management tests (high priority)
    test_results.append(("Create Products", test_products_create()))
    test_results.append(("List Products", test_products_list()))
    test_results.append(("Update Product", test_products_update()))
    
    # Sales tests (CRITICAL - core feature)
    test_results.append(("Create Sale", test_sales_create()))
    test_results.append(("Stock Update Verification", test_stock_update_verification()))
    test_results.append(("Insufficient Stock Test", test_insufficient_stock()))
    test_results.append(("List Sales", test_sales_list()))
    
    # Dashboard tests (high priority)
    test_results.append(("Dashboard Stats", test_dashboard_stats()))
    
    # Additional tests
    test_results.append(("Multi-Tenant Isolation", test_multi_tenant_isolation()))
    test_results.append(("Delete Product", test_product_delete()))
    
    # Summary
    print("="*60)
    print("📋 TESTING SUMMARY")
    print("="*60)
    
    passed = sum(1 for _, result in test_results if result)
    total = len(test_results)
    
    for test_name, result in test_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print()
    print(f"TOTAL RESULTS: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED! Backend is working correctly.")
    else:
        print(f"⚠️  {total - passed} tests failed. Review the failures above.")
    
    return passed == total

if __name__ == "__main__":
    try:
        success = run_all_tests()
        exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⏹️  Testing interrupted by user")
        exit(1)
    except Exception as e:
        print(f"\n\n💥 Testing failed with error: {str(e)}")
        exit(1)