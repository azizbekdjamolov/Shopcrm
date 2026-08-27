from django.db.models import Sum, Count, Avg, F, Q
from django.utils import timezone
from datetime import timedelta


class ReportService:

    @staticmethod
    def sales_report(business, start_date=None, end_date=None, branch_id=None):
        from apps.sales.models import Sale, SaleItem
        from apps.products.models import Product
        if not start_date:
            start_date = timezone.now().date() - timedelta(days=30)
        if not end_date:
            end_date = timezone.now().date()
        queryset = Sale.objects.filter(
            business=business, is_deleted=False,
            created_at__date__gte=start_date, created_at__date__lte=end_date,
            status='completed',
        )
        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)
        totals = queryset.aggregate(
            total_sales=Sum('total'),
            total_count=Count('id'),
            avg_sale=Avg('total'),
        )
        daily_sales = queryset.extra(
            select={'date': "DATE(created_at)"}
        ).values('date').annotate(
            amount=Sum('total'),
        ).order_by('date')

        payment_breakdown = queryset.values('payment_method').annotate(
            total=Sum('total'),
            count=Count('id'),
        )

        items = SaleItem.objects.filter(
            sale__in=queryset, is_deleted=False
        ).select_related('product')

        product_stats = {}
        for item in items:
            name = item.product.name
            if name not in product_stats:
                product_stats[name] = {'product': name, 'quantity': 0, 'amount': 0}
            product_stats[name]['quantity'] += item.quantity
            product_stats[name]['amount'] += float(item.total)
        top_products = sorted(product_stats.values(), key=lambda x: x['amount'], reverse=True)[:10]

        return {
            'total_sales': float(totals['total_sales'] or 0),
            'total_orders': totals['total_count'] or 0,
            'average_order_value': float(round(totals['avg_sale'] or 0, 2)),
            'sales_by_date': [
                {'date': str(s['date']), 'amount': float(s['amount'] or 0)}
                for s in daily_sales
            ],
            'sales_by_category': [],
            'top_products': top_products,
            'payment_by_method': [
                {'method': p['payment_method'], 'total': float(p['total'] or 0), 'count': p['count']}
                for p in payment_breakdown
            ],
        }

    @staticmethod
    def profit_report(business, start_date=None, end_date=None, branch_id=None):
        from apps.sales.models import Sale, SaleItem
        from apps.expenses.models import Expense
        if not start_date:
            start_date = timezone.now().date() - timedelta(days=30)
        if not end_date:
            end_date = timezone.now().date()
        sales = Sale.objects.filter(
            business=business, is_deleted=False, status='completed',
            created_at__date__gte=start_date, created_at__date__lte=end_date,
        )
        if branch_id:
            sales = sales.filter(branch_id=branch_id)
        items = SaleItem.objects.filter(
            sale__in=sales, is_deleted=False
        ).select_related('product')
        total_revenue = sales.aggregate(total=Sum('total'))['total'] or 0
        total_cost = sum(
            item.quantity * item.product.purchase_price for item in items
        )
        profit = float(total_revenue) - float(total_cost)
        expenses_total = Expense.objects.filter(
            business=business, is_deleted=False,
            date__gte=start_date, date__lte=end_date,
        ).aggregate(total=Sum('amount'))['total'] or 0
        net_profit = profit - float(expenses_total)
        margin = (profit / float(total_revenue) * 100) if total_revenue > 0 else 0

        daily = sales.extra(
            select={'date': "DATE(created_at)"}
        ).values('date').annotate(
            revenue=Sum('total'),
        ).order_by('date')
        profit_by_date = [
            {'date': str(d['date']), 'revenue': float(d['revenue'] or 0), 'cost': 0, 'profit': float(d['revenue'] or 0)}
            for d in daily
        ]

        return {
            'total_revenue': float(total_revenue),
            'total_cost': float(total_cost),
            'total_expenses': float(expenses_total),
            'gross_profit': profit,
            'net_profit': net_profit,
            'profit_margin': round(margin, 2),
            'profit_by_date': profit_by_date,
            'profit_by_category': [],
        }

    @staticmethod
    def expense_report(business, start_date=None, end_date=None, branch_id=None):
        from apps.expenses.models import Expense
        if not start_date:
            start_date = timezone.now().date() - timedelta(days=30)
        if not end_date:
            end_date = timezone.now().date()
        queryset = Expense.objects.filter(
            business=business, is_deleted=False,
            date__gte=start_date, date__lte=end_date,
        )
        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)
        total = queryset.aggregate(total=Sum('amount'))['total'] or 0
        by_category = queryset.values(
            'category__name'
        ).annotate(
            total=Sum('amount'),
            count=Count('id'),
        ).order_by('-total')
        daily = queryset.extra(
            select={'date': 'date'}
        ).values('date').annotate(
            total=Sum('amount'),
        ).order_by('date')
        return {
            'period': {'start': str(start_date), 'end': str(end_date)},
            'total_expenses': str(total),
            'by_category': list(by_category),
            'daily_expenses': list(daily),
        }

    @staticmethod
    def inventory_report(business):
        from apps.inventory.models import Inventory
        inventories = Inventory.objects.filter(
            business=business, is_deleted=False
        ).select_related('product')
        total_items = inventories.count()
        total_value = sum(inv.stock_value for inv in inventories)
        low_stock = [inv for inv in inventories if inv.is_low_stock]
        out_of_stock = inventories.filter(quantity=0)
        return {
            'total_items': total_items,
            'total_stock_value': str(total_value),
            'low_stock_count': len(low_stock),
            'out_of_stock_count': out_of_stock.count(),
            'low_stock_products': [
                {
                    'product': inv.product.name,
                    'quantity': inv.quantity,
                    'minimum': inv.minimum_stock,
                }
                for inv in low_stock
            ],
        }

    @staticmethod
    def debt_report(business, start_date=None, end_date=None):
        from apps.debts.models import Debt
        if not start_date:
            start_date = timezone.now().date() - timedelta(days=30)
        if not end_date:
            end_date = timezone.now().date()
        debts = Debt.objects.filter(
            business=business, is_deleted=False,
            created_at__date__gte=start_date, created_at__date__lte=end_date,
        )
        total_debt = debts.aggregate(total=Sum('total_amount'))['total'] or 0
        total_paid = debts.aggregate(total=Sum('paid_amount'))['total'] or 0
        total_remaining = debts.aggregate(total=Sum('remaining_amount'))['total'] or 0
        by_status = debts.values('status').annotate(
            count=Count('id'),
            total=Sum('total_amount'),
        )
        return {
            'period': {'start': str(start_date), 'end': str(end_date)},
            'total_debt': str(total_debt),
            'total_paid': str(total_paid),
            'total_remaining': str(total_remaining),
            'by_status': list(by_status),
        }

    @staticmethod
    def employee_performance(business, start_date=None, end_date=None):
        from apps.employees.models import Employee
        if not start_date:
            start_date = timezone.now().date() - timedelta(days=30)
        if not end_date:
            end_date = timezone.now().date()
        employees = Employee.objects.filter(
            business=business, status='active', is_deleted=False
        )
        from apps.employees.services import EmployeeService
        performances = []
        for emp in employees:
            perf = EmployeeService.calculate_performance(emp, start_date, end_date)
            performances.append(perf)
        return {
            'period': {'start': str(start_date), 'end': str(end_date)},
            'employees': performances,
        }

    @staticmethod
    def courier_performance(business, start_date=None, end_date=None):
        from apps.delivery.models import Delivery, CourierRating
        from apps.accounts.models import User
        if not start_date:
            start_date = timezone.now().date() - timedelta(days=30)
        if not end_date:
            end_date = timezone.now().date()
        couriers = User.objects.filter(
            business_roles__business=business,
            business_roles__role='courier',
            business_roles__is_active=True,
        ).distinct()
        stats = []
        for courier in couriers:
            deliveries = Delivery.objects.filter(
                courier=courier, is_deleted=False,
                delivered_at__date__gte=start_date,
                delivered_at__date__lte=end_date,
            )
            completed = deliveries.filter(status='DELIVERED').count()
            ratings = CourierRating.objects.filter(
                courier=courier, is_deleted=False
            )
            avg_rating = ratings.aggregate(avg=Avg('rating'))['avg'] or 0
            stats.append({
                'courier_id': str(courier.id),
                'courier_name': courier.get_full_name() or courier.email,
                'completed_deliveries': completed,
                'average_rating': round(avg_rating, 2),
                'total_ratings': ratings.count(),
            })
        return {
            'period': {'start': str(start_date), 'end': str(end_date)},
            'couriers': stats,
        }

    @staticmethod
    def branch_performance(business, start_date=None, end_date=None):
        from apps.businesses.models import Branch
        from apps.sales.models import Sale
        from apps.orders.models import Order
        if not start_date:
            start_date = timezone.now().date() - timedelta(days=30)
        if not end_date:
            end_date = timezone.now().date()
        branches = Branch.objects.filter(business=business, is_active=True)
        stats = []
        for branch in branches:
            sales = Sale.objects.filter(
                business=business, branch=branch, is_deleted=False, status='completed',
                created_at__date__gte=start_date, created_at__date__lte=end_date,
            )
            orders = Order.objects.filter(
                business=business, branch=branch, is_deleted=False,
                created_at__date__gte=start_date, created_at__date__lte=end_date,
            )
            total_sales = sales.aggregate(total=Sum('total'))['total'] or 0
            stats.append({
                'branch_id': str(branch.id),
                'branch_name': branch.name,
                'total_sales': str(total_sales),
                'sales_count': sales.count(),
                'orders_count': orders.count(),
            })
        return {
            'period': {'start': str(start_date), 'end': str(end_date)},
            'branches': stats,
        }

    @staticmethod
    def product_performance(business, start_date=None, end_date=None):
        from apps.sales.models import SaleItem
        if not start_date:
            start_date = timezone.now().date() - timedelta(days=30)
        if not end_date:
            end_date = timezone.now().date()
        items = SaleItem.objects.filter(
            business=business, is_deleted=False,
            sale__status='completed',
            sale__created_at__date__gte=start_date,
            sale__created_at__date__lte=end_date,
        ).select_related('product')
        product_stats = {}
        for item in items:
            pid = str(item.product.id)
            if pid not in product_stats:
                product_stats[pid] = {
                    'product_id': pid,
                    'product_name': item.product.name,
                    'total_quantity': 0,
                    'total_revenue': 0,
                }
            product_stats[pid]['total_quantity'] += item.quantity
            product_stats[pid]['total_revenue'] += float(item.total)
        sorted_products = sorted(
            product_stats.values(), key=lambda x: x['total_revenue'], reverse=True
        )
        return {
            'period': {'start': str(start_date), 'end': str(end_date)},
            'products': sorted_products,
        }
