from . import views
from django.urls import path

urlpatterns = [
    path('', views.LoopList.as_view(), name='home'),
]