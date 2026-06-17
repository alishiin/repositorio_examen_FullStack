from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("match_app", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="petanalysis",
            name="report_id",
            field=models.CharField(
                max_length=100,
                unique=True,
                help_text="ID del reporte (puede venir como string con prefijo)",
            ),
        ),
        migrations.AlterField(
            model_name="matchresult",
            name="lost_report_id",
            field=models.CharField(max_length=100),
        ),
        migrations.AlterField(
            model_name="matchresult",
            name="found_report_id",
            field=models.CharField(max_length=100),
        ),
    ]
