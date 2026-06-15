FROM nginx:alpine

# Copier uniquement les fichiers statiques
COPY dist/ixora/browser/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]  