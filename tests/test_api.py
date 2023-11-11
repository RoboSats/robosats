import urllib.request

from openapi_tester.schema_tester import SchemaTester
from rest_framework.response import Response
from rest_framework.test import APITestCase

# Update api specs to the newest from a running django server (if any)
try:
    urllib.request.urlretrieve(
        "http://127.0.0.1:8000/api/schema", "tests/api_specs.yaml"
    )
except Exception as e:
    print(f"Could not fetch current API specs: {e}")
    print("Using previously existing api_specs.yaml definitions")

schema_tester = SchemaTester(schema_file_path="tests/api_specs.yaml")


class BaseAPITestCase(APITestCase):
    @staticmethod
    def assertResponse(response: Response, **kwargs) -> None:
        """helper to run validate_response and pass kwargs to it"""

        # List of endpoints with no available OpenAPI schema
        skip_paths = ["/coordinator/login/"]

        if response.request["PATH_INFO"] not in skip_paths:
            schema_tester.validate_response(response=response, **kwargs)
