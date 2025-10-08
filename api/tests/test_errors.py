from api.errors import ERRORS, new_error

from django.test import TestCase


class TestErrors(TestCase):
    def test_new_error(self):
        error_code = 1000
        error = new_error(error_code)

        self.assertEqual(error["error_code"], error_code)
        self.assertEqual(error["bad_request"], ERRORS[error_code])

    def test_new_error_bad_statement(self):
        error_code = 2000
        error = new_error(error_code)

        self.assertEqual(error["error_code"], error_code)
        self.assertEqual(error["bad_statement"], ERRORS[error_code])

    def test_new_error_bad_invoice(self):
        error_code = 3000
        error = new_error(error_code)

        self.assertEqual(error["error_code"], error_code)
        self.assertEqual(error["bad_invoice"], ERRORS[error_code])

    def test_new_error_bad_address(self):
        error_code = 4000
        error = new_error(error_code)

        self.assertEqual(error["error_code"], error_code)
        self.assertEqual(error["bad_address"], ERRORS[error_code])

    def test_new_error_bad_summary(self):
        error_code = 5000
        error = new_error(error_code)

        self.assertEqual(error["error_code"], error_code)
        self.assertEqual(error["bad_summary"], ERRORS[error_code])

    def test_new_error_chat(self):
        error_code = 6000
        error = new_error(error_code)

        self.assertEqual(error["error_code"], error_code)
        self.assertEqual(error["bad_request"], ERRORS[error_code])

    def test_new_error_middleware(self):
        error_code = 7000
        error = new_error(error_code)

        self.assertEqual(error["error_code"], error_code)
        self.assertEqual(error["bad_request"], ERRORS[error_code])

    def test_new_error_parametrized(self):
        error_code = 4001
        min_mining_fee_rate = 5
        error = new_error(error_code, {"min_mining_fee_rate": 5})

        self.assertEqual(error["error_code"], error_code)
        self.assertEqual(
            error["bad_address"],
            f"The mining fee is too low. Must be higher than {min_mining_fee_rate} Sat/vbyte",
        )
