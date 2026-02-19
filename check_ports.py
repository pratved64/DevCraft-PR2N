import socket
import sys
import errno

def check_port(port):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        s.bind(("0.0.0.0", port))
        print(f"Port {port} is free to bind on 0.0.0.0")
        s.close()
        return True
    except OSError as e:
        if e.errno == errno.EADDRINUSE:
            print(f"Port {port} is already in use (EADDRINUSE)")
        else:
            print(f"Port {port} error: {e}")
        return False

if __name__ == "__main__":
    p8000 = check_port(8000)
    p3000 = check_port(3000)
    if not p8000 or not p3000:
        sys.exit(1)
