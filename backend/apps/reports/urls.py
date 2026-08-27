from django.urls import path
from . import views

urlpatterns = [
    path('sales/', views.ReportViewSet.as_view({'get': 'sales'}), name='report-sales'),
    path('profit/', views.ReportViewSet.as_view({'get': 'profit'}), name='report-profit'),
    path('expenses/', views.ReportViewSet.as_view({'get': 'expenses'}), name='report-expenses'),
    path('inventory/', views.ReportViewSet.as_view({'get': 'inventory'}), name='report-inventory'),
    path('debts/', views.ReportViewSet.as_view({'get': 'debts'}), name='report-debts'),
    path('employee-performance/', views.ReportViewSet.as_view({'get': 'employee_performance'}), name='report-employee-performance'),
    path('courier-performance/', views.ReportViewSet.as_view({'get': 'courier_performance'}), name='report-courier-performance'),
    path('branch-performance/', views.ReportViewSet.as_view({'get': 'branch_performance'}), name='report-branch-performance'),
    path('product-performance/', views.ReportViewSet.as_view({'get': 'product_performance'}), name='report-product-performance'),
]
