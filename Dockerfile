FROM odoo:17.0

USER root

RUN pip3 install Pillow pycryptodome psycopg2-binary

COPY . /mnt/extra-addons

RUN chown -R odoo:odoo /mnt/extra-addons

USER odoo

CMD ["odoo", \
"--addons-path=/mnt/extra-addons,/usr/lib/python3/dist-packages/odoo/addons", \
"--db_host=${PGHOST}", \
"--db_port=${PGPORT}", \
"--db_user=${PGUSER}", \
"--db_password=${PGPASSWORD}"]
