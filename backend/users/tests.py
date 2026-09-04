from django.test import SimpleTestCase
from rest_framework.test import APIRequestFactory
from unittest.mock import patch

from .views import VerifyEmailOTPForSignupView


class VerifyEmailOTPForSignupViewTests(SimpleTestCase):
    def setUp(self):
        self.factory = APIRequestFactory()

    @patch("users.views.EmailOTPService.verify_otp_for_signup")
    def test_signup_otp_verification_accepts_email_and_otp(self, mock_verify_otp_for_signup):
        mock_verify_otp_for_signup.return_value = (True, "OTP verified successfully for signup.")

        request = self.factory.post(
            "/api/users/verify-email-otp-signup/",
            {"email": "user@example.com", "otp": "123456"},
            format="json",
        )

        response = VerifyEmailOTPForSignupView.as_view()(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "success")
        mock_verify_otp_for_signup.assert_called_once_with("user@example.com", "123456")
