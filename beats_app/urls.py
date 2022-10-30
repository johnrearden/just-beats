from . import views
from django.urls import path

urlpatterns = [
    path('', views.LoopList.as_view(), name='home'),
    path('editor/<int:id>', views.LoopEditor.as_view(), name='loop_editor'),
    path('tracks/<int:id>', views.TracksForLoop.as_view(), name='tracks'),
]