from django.db import transaction
from django.template.loader import render_to_string
from io import BytesIO

from .models import Invoice


class InvoiceService:

    @staticmethod
    @transaction.atomic
    def generate_invoice(business, sale=None, order=None, customer=None, notes=''):
        items = []
        subtotal = 0
        discount = 0
        tax = 0
        total = 0
        payment_method = ''

        if sale:
            sale_items = sale.items.select_related('product').all()
            for item in sale_items:
                items.append({
                    'product_name': item.product.name,
                    'quantity': item.quantity,
                    'unit_price': str(item.unit_price),
                    'discount': str(item.discount),
                    'total': str(item.total),
                })
            subtotal = sale.subtotal
            discount = sale.discount
            tax = sale.tax
            total = sale.total
            payment_method = sale.payment_method
            customer = customer or sale.customer
        elif order:
            order_items = order.items.select_related('product').all()
            for item in order_items:
                items.append({
                    'product_name': item.product.name,
                    'quantity': item.quantity,
                    'unit_price': str(item.unit_price),
                    'discount': '0',
                    'total': str(item.total),
                })
            subtotal = order.subtotal
            discount = order.discount
            total = order.total
            payment_method = order.payment_method
            customer = customer or order.customer

        invoice = Invoice.objects.create(
            business=business,
            sale=sale,
            order=order,
            customer=customer,
            items=items,
            subtotal=subtotal,
            discount=discount,
            tax=tax,
            total=total,
            payment_method=payment_method,
            notes=notes,
        )
        return invoice

    @staticmethod
    def generate_pdf(invoice):
        try:
            from weasyprint import HTML
            html_string = InvoiceService._render_invoice_template(invoice)
            html = HTML(string=html_string)
            pdf_buffer = BytesIO()
            html.write_pdf(pdf_buffer)
            pdf_buffer.seek(0)
            return pdf_buffer
        except ImportError:
            return None

    @staticmethod
    def _render_invoice_template(invoice):
        business = invoice.business
        customer = invoice.customer
        items_html = ''
        for item in invoice.items:
            items_html += f'''
            <tr>
                <td>{item['product_name']}</td>
                <td style="text-align:center">{item['quantity']}</td>
                <td style="text-align:right">{item['unit_price']}</td>
                <td style="text-align:right">{item['discount']}</td>
                <td style="text-align:right">{item['total']}</td>
            </tr>
            '''
        return f'''
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                .header {{ text-align: center; margin-bottom: 30px; }}
                .invoice-info {{ display: flex; justify-content: space-between; margin-bottom: 20px; }}
                table {{ width: 100%; border-collapse: collapse; }}
                th, td {{ padding: 10px; border: 1px solid #ddd; text-align: left; }}
                th {{ background-color: #f5f5f5; }}
                .total-section {{ text-align: right; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>{business.name}</h1>
                <p>{business.address}</p>
                <p>{business.phone}</p>
            </div>
            <div class="invoice-info">
                <div>
                    <h2>Invoice #{invoice.invoice_number}</h2>
                    <p>Date: {invoice.created_at.strftime('%Y-%m-%d')}</p>
                </div>
                <div>
                    <h3>Bill To:</h3>
                    <p>{customer.name if customer else 'N/A'}</p>
                    <p>{customer.phone if customer else ''}</p>
                </div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Product</th>
                        <th style="text-align:center">Qty</th>
                        <th style="text-align:right">Unit Price</th>
                        <th style="text-align:right">Discount</th>
                        <th style="text-align:right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {items_html}
                </tbody>
            </table>
            <div class="total-section">
                <p>Subtotal: {invoice.subtotal}</p>
                <p>Discount: {invoice.discount}</p>
                <p>Tax: {invoice.tax}</p>
                <p><strong>Total: {invoice.total}</strong></p>
            </div>
            {f'<p>Notes: {invoice.notes}</p>' if invoice.notes else ''}
        </body>
        </html>
        '''
