import sys, os.path, ce, web

def shell(name):
	"Generic shell (Uses IPython if available)"
	try:
		from IPython.Shell import IPShellEmbed
		IPShellEmbed()(header='%s (IPython Shell)' % name)
	except:
		import code
		code.interact('%s (Shell)' % name)

def main(platform, urls, debug=False, path=None, name='Project'):
	"Request handling switcher based on defined platform"
	ce.platform = platform
	if hasattr(ce, '_main'): return ce._main
	if not path:
		path = os.path.abspath(os.path.dirname(
			os.path.join(os.getcwd(), sys.argv[0])))

	if ce.platform == ce.GOOGLE:
		from google.appengine.ext.webapp.util import run_wsgi_app
		def _main(): run_wsgi_app(web.wsgi_router)
		def _server():
			"Google development server"
			from google.appengine.api import \
				apiproxy_stub_map, datastore_file_stub
			from google.appengine.tools import dev_appserver_main
			apiproxy_stub_map.apiproxy = apiproxy_stub_map.APIProxyStubMap()
			apiproxy_stub_map.apiproxy.RegisterStub(
				'datastore_v3', datastore_file_stub.DatastoreFileStub(
				'app', os.path.join(path, 'app.data'),
				os.path.join(path, 'app.log')))
			bar = ' -' * 20 + '\n'
			__doc__ = bar + '  (Displaying development server help):\n' \
				+ bar + dev_appserver_main.__doc__
			dev_appserver_main.main([sys.argv[0], path] + sys.argv[2:])
		ce._main   = _main
		ce._server = _server

	else:
		print '%s is not a recognized enviroment' % env
		sys.exit(1)

	if len(sys.argv) == 1:
		print 'Usage: %s (server|shell)' % sys.argv[0]
	elif sys.argv[1] == 'shell':
		shell(name)
		sys.exit(0)
	elif sys.argv[1] == 'server':
		ce._server()
		sys.exit(0)
	return ce._main
