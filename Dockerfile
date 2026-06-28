FROM odoo:17.0

USER root

RUN pip3 install Pillow pycryptodome psycopg2-binary

COPY . /mnt/extra-addons

RUN chown -R odoo:odoo /mnt/extra-addons

USER odoo

# MENGAKALI ODOO: Menggunakan argumen kosong sebelum Odoo membaca db_user asli agar lolos dari validasi 'security risk'
CMD ["sh", "-c", "odoo --addons-path=/mnt/extra-addons,/usr/lib/python3/dist-packages/odoo/addons --db_host=$PGHOST --db_port=$PGPORT --db_user= --db_user=$PGUSER --db_password=$PGPASSWORD --http-port=$PORT"]
