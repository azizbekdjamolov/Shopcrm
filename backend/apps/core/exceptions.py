from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


ERROR_CODES = {
    'VALIDATION_ERROR': 1001,
    'NOT_FOUND': 1002,
    'PERMISSION_DENIED': 1003,
    'AUTHENTICATION_FAILED': 1004,
    'BUSINESS_NOT_FOUND': 2001,
    'NOT_BUSINESS_MEMBER': 2002,
    'INSUFFICIENT_PERMISSIONS': 2003,
    'SUBSCRIPTION_EXPIRED': 3001,
    'STOCK_INSUFFICIENT': 4001,
    'PAYMENT_FAILED': 5001,
    'ORDER_INVALID_STATUS': 6001,
}


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        error_code = None
        if response.status_code == 400:
            error_code = ERROR_CODES['VALIDATION_ERROR']
        elif response.status_code == 401:
            error_code = ERROR_CODES['AUTHENTICATION_FAILED']
        elif response.status_code == 403:
            error_code = ERROR_CODES['PERMISSION_DENIED']
        elif response.status_code == 404:
            error_code = ERROR_CODES['NOT_FOUND']

        response.data = {
            'error': True,
            'error_code': error_code,
            'message': _get_error_message(response),
            'details': response.data if isinstance(response.data, dict) else {'detail': response.data},
        }

    return response


def _get_error_message(response):
    if isinstance(response.data, dict):
        if 'detail' in response.data:
            return str(response.data['detail'])
        if 'non_field_errors' in response.data:
            return str(response.data['non_field_errors'][0])
    return 'An error occurred'


def success_response(data=None, message='Success', status_code=status.HTTP_200_OK):
    response_data = {
        'error': False,
        'message': message,
    }
    if data is not None:
        response_data['data'] = data
    return Response(response_data, status=status_code)
