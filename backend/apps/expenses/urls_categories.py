from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.ExpenseCategoryViewSet, basename='expense-category')

urlpatterns = router.urls
