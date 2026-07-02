import xmlrpc.client

def list_databases():
    """List all available databases in Odoo"""
    
    try:
        common = xmlrpc.client.ServerProxy('http://localhost:8069/xmlrpc/2/common')
        databases = common.list()
        
        print("📦 Available Odoo Databases:")
        for db in databases:
            print(f"  - {db}")
        
        return databases
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    list_databases()
