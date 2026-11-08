@echo off
cd /d "%~dp0"
py -3 -m gateway.mock_gateway --port 8766
