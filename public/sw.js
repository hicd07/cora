self.addEventListener('push', function(event) {
  if (event.data) {
    try {
      const data = event.data.json();
      
      const options = {
        body: data.body || 'Tienes una nueva notificación en CoRa',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        vibrate: [100, 50, 100],
        data: {
          dateOfArrival: Date.now(),
          primaryKey: '2',
          url: data.url || '/'
        },
        actions: [
          {action: 'explore', title: 'Ver detalles', icon: '/favicon.ico'},
          {action: 'close', title: 'Cerrar', icon: '/favicon.ico'},
        ]
      };

      event.waitUntil(
        self.registration.showNotification(data.title || 'CoRa', options)
      );
    } catch (e) {
      console.error('Error parsing push data', e);
    }
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'explore' || !event.action) {
    const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

    event.waitUntil(
      clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      }).then(function(clientList) {
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
});
