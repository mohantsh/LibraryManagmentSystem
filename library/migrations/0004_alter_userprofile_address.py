# Generated by Django 5.2.1 on 2025-05-17 16:10

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('library', '0003_alter_userprofile_phone_number'),
    ]

    operations = [
        migrations.AlterField(
            model_name='userprofile',
            name='address',
            field=models.TextField(blank=True, null=True),
        ),
    ]
