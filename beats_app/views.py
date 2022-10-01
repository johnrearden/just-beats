from django.shortcuts import render
from django.views import View
from .models import Drumloop, Track, Instrument

class LoopEditor(View):
    def get(self, request, name='default_name', *args, **kwargs):
        loop = Drumloop.objects.get_or_create(name=name)[:1]
        print(f"number of loops returned = {len(loop)}")

        return render(
            request,
            "loop_editor.html",
            {
                "obj": loop,
            }
        )
