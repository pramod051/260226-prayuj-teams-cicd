#!/bin/bash

echo "Testing OTP Registration Flow..."
echo ""

# Test registration
echo "1. Testing registration endpoint..."
RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser999","email":"test999@example.com","password":"test1234"}')

echo "Response: $RESPONSE"
echo ""

# Check if requiresVerification is true
if echo "$RESPONSE" | grep -q '"requiresVerification":true'; then
  echo "✅ Registration successful - requiresVerification is true"
else
  echo "❌ Registration failed or requiresVerification not set"
fi

echo ""
echo "2. Check frontend bundle for OTP components..."
docker-compose exec -T frontend sh -c "cat /usr/share/nginx/html/static/js/main.*.js | grep -o 'verify-otp' | head -1" && echo "✅ verify-otp route found in bundle" || echo "❌ verify-otp route NOT found"

docker-compose exec -T frontend sh -c "cat /usr/share/nginx/html/static/js/main.*.js | grep -o 'Verify Your Email' | head -1" && echo "✅ VerifyOTP component found in bundle" || echo "❌ VerifyOTP component NOT found"

docker-compose exec -T frontend sh -c "cat /usr/share/nginx/html/static/js/main.*.js | grep -o 'state:{email:' | head -1" && echo "✅ Navigation with email state found in bundle" || echo "❌ Navigation code NOT found"

echo ""
echo "3. Testing frontend accessibility..."
curl -s http://localhost:3000 > /dev/null && echo "✅ Frontend accessible at http://localhost:3000" || echo "❌ Frontend not accessible"

echo ""
echo "All checks complete! Try registering at http://localhost:3000/register"
echo "After registration, you should be redirected to /verify-otp"
echo ""
echo "If redirect doesn't work, try:"
echo "  - Clear browser cache (Ctrl+Shift+Delete)"
echo "  - Hard refresh (Ctrl+F5)"
echo "  - Open in incognito/private window"
