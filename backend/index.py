from api import create_app
# from werkzeug.contrib.fixers import ProxyFix
from werkzeug.middleware.proxy_fix import ProxyFix
app = create_app()

app.wsgi_app = ProxyFix(app.wsgi_app)
