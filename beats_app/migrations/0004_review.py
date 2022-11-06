# Generated by Django 3.2.15 on 2022-11-06 00:58

from django.conf import settings
import django.core.validators
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('beats_app', '0003_auto_20221102_1106'),
    ]

    operations = [
        migrations.CreateModel(
            name='Review',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('rating', models.IntegerField(default=0, validators=[django.core.validators.MaxValueValidator(5), django.core.validators.MinValueValidator(0)])),
                ('comment', models.TextField(default='No comment', max_length=200)),
                ('created_on', models.DateTimeField(auto_now_add=True)),
                ('drumloop', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='loops', to='beats_app.drumloop')),
                ('reviewer', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='reviewers', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
