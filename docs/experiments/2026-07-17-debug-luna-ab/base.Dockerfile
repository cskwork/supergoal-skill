FROM python:3.11-slim-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates procps \
 && rm -rf /var/lib/apt/lists/*
# setuptools: old sympy imports distutils; the setuptools shim keeps that working
RUN pip install --no-cache-dir setuptools mpmath==1.3.0 pytest
ENV PYTHONPATH=/app
WORKDIR /app
RUN git clone https://github.com/sympy/sympy .
CMD ["/bin/bash"]
