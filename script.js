document.addEventListener('DOMContentLoaded', () => {
  const themeSelect = document.getElementById('theme');
  const form = document.querySelector('.task-form form');
  const taskInput = document.getElementById('task');
  const dueDateInput = document.getElementById('due-date');
  const prioritySelect = document.getElementById('priority');
  const taskListUL = document.querySelector('.task-list ul');

  // Botones de filtro, export y undo/redo
  const filterAllBtn = document.getElementById('filter-all');
  const filterCompletedBtn = document.getElementById('filter-completed');
  const filterPendingBtn = document.getElementById('filter-pending');
  const exportCSVButton = document.getElementById('export-csv'); // Asume botón en HTML
  const undoButton = document.getElementById('undo');
  const redoButton = document.getElementById('redo');

  let tasks = [];
  let currentFilter = 'all';
  let dragStartIndex = null;

  // Pilas para undo/redo
  let undoStack = [];
  let redoStack = [];

  // Cargar tareas y tema desde LocalStorage
  const storedTasks = localStorage.getItem('tasks');
  if (storedTasks) {
    tasks = JSON.parse(storedTasks);
  }
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme) {
    themeSelect.value = storedTheme;
    document.body.className = storedTheme === 'dark' ? 'dark-theme' : '';
    // Aplicar tema cambiando colores en CSS
  }

  // Función para guardar en LocalStorage
  function saveData() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('theme', themeSelect.value);
  }

  // Función para guardar el estado actual en la pila de undo
  function pushUndoState() {
    undoStack.push(JSON.stringify(tasks));
    redoStack = [];
  }

  function undo() {
    if (!undoStack.length) return;
    redoStack.push(JSON.stringify(tasks));
    tasks = JSON.parse(undoStack.pop());
    renderTasks();
  }

  function redo() {
    if (!redoStack.length) return;
    undoStack.push(JSON.stringify(tasks));
    tasks = JSON.parse(redoStack.pop());
    renderTasks();
  }

  // Cambiar tema y guardar preferencia
  themeSelect.addEventListener('change', (e) => {
    if (e.target.value === 'dark') {
      document.body.className = 'dark-theme';
    } else {
      document.body.className = '';
    }
    saveData();
  });

  // Exportar tareas a CSV (Bonus)
  if (exportCSVButton) {
    exportCSVButton.addEventListener('click', () => {
      let csvContent = 'data:text/csv;charset=utf-8,';
      csvContent += 'ID,Tarea,Fecha Límite,Prioridad,Completada\n';
      tasks.forEach(task => {
        csvContent += `${task.id},"${task.text}",${task.dueDate},${task.priority},${task.completed}\n`;
      });
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', 'tareas.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  // Notificaciones (Bonus): programar notificaciones para tareas próximas a vencer
  function scheduleNotifications() {
    tasks.forEach(task => {
      if (task.dueDate && !task.notified) {
        const dueTime = new Date(task.dueDate).getTime();
        const now = Date.now();
        const diff = dueTime - now;
        // Notificar si faltan menos de 1 día (86400000 ms) y no ha pasado ya
        if (diff > 0 && diff <= 86400000) {
          setTimeout(() => {
            if (Notification.permission === 'granted') {
              new Notification('Tarea próxima a vencer', {
                body: `${task.text} vence pronto!`
              });
            }
            task.notified = true;
            saveData();
          }, diff);
        }
      }
    });
  }

  if (Notification.permission !== 'granted') {
    Notification.requestPermission();
  }

  // Agregar o editar tarea desde el formulario
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const taskText = taskInput.value.trim();
    if (!taskText) {
      alert("El texto de la tarea no puede estar vacío");
      return;
    }
    const dueDate = dueDateInput.value;
    const priority = prioritySelect.value;

    pushUndoState();
    tasks.push({
      id: Date.now(),
      text: taskText,
      dueDate,
      priority,
      completed: false,
      notified: false
    });
    form.reset();
    renderTasks();
  });

  // Animación de fade-out usando CSS, se asume que existe la clase 'fade-out' definida en CSS
  function animateRemoval(element, callback) {
    element.classList.add('fade-out');
    element.addEventListener('animationend', () => {
      callback();
    }, { once: true });
  }

  // Función para reordenar tasks usando drag & drop
  function swapTasks(fromIndex, toIndex) {
    pushUndoState();
    const temp = tasks[fromIndex];
    tasks[fromIndex] = tasks[toIndex];
    tasks[toIndex] = temp;
  }

  function renderTasks() {
    scheduleNotifications();
    let filteredTasks = tasks;
    if (currentFilter === 'completed') {
      filteredTasks = tasks.filter(task => task.completed);
    } else if (currentFilter === 'pending') {
      filteredTasks = tasks.filter(task => !task.completed);
    }
    
    taskListUL.innerHTML = '';
    filteredTasks.forEach((task) => {
      const li = document.createElement('li');

      // Si se muestra el filtro "all", habilitar el drag & drop
      if (currentFilter === 'all') {
        li.draggable = true;
        const realIndex = tasks.findIndex(t => t.id === task.id);
        li.dataset.index = realIndex;
        li.addEventListener('dragstart', () => {
          dragStartIndex = Number(li.dataset.index);
          li.classList.add('dragging');
        });
        li.addEventListener('dragover', (e) => {
          e.preventDefault();
        });
        li.addEventListener('drop', () => {
          const dragEndIndex = Number(li.dataset.index);
          swapTasks(dragStartIndex, dragEndIndex);
          renderTasks();
        });
        li.addEventListener('dragend', () => {
          li.classList.remove('dragging');
        });
      }

      const leftDiv = document.createElement('div');

      // Checkbox para marcar tarea completada
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `task-${task.id}`;
      checkbox.checked = task.completed;
      checkbox.addEventListener('change', () => {
        pushUndoState();
        task.completed = checkbox.checked;
        renderTasks();
      });
      leftDiv.appendChild(checkbox);

      // Contenedor para mostrar contenido o edición
      const contentDiv = document.createElement('div');
      contentDiv.className = 'content';

      // Texto y fecha
      const label = document.createElement('label');
      label.setAttribute('for', `task-${task.id}`);
      label.textContent = task.text + (task.dueDate ? ' (Fecha límite: ' + task.dueDate + ')' : '');
      contentDiv.appendChild(label);

      // Prioridad con color propio
      const prioritySpan = document.createElement('span');
      prioritySpan.textContent = ' (Prioridad: ' + task.priority.toUpperCase() + ')';
      switch (task.priority) {
        case 'alta':
          prioritySpan.style.color = 'red';
          break;
        case 'media':
          prioritySpan.style.color = 'orange';
          break;
        case 'baja':
          prioritySpan.style.color = 'green';
          break;
        default:
          prioritySpan.style.color = 'black';
      }
      contentDiv.appendChild(prioritySpan);

      leftDiv.appendChild(contentDiv);
      li.appendChild(leftDiv);

      // Contenedor para los botones de acciones
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'actions';

      const editButton = document.createElement('button');
      editButton.textContent = 'Editar';
      editButton.addEventListener('click', () => {
        contentDiv.innerHTML = '';

        const editText = document.createElement('input');
        editText.type = 'text';
        editText.value = task.text;
        editText.placeholder = 'Editar tarea';

        const editDate = document.createElement('input');
        editDate.type = 'date';
        editDate.value = task.dueDate;

        const editPriority = document.createElement('select');
        ['alta', 'media', 'baja'].forEach(opt => {
          const o = document.createElement('option');
          o.value = opt;
          o.textContent = opt.charAt(0).toUpperCase() + opt.slice(1);
          if (opt === task.priority) o.selected = true;
          editPriority.appendChild(o);
        });

        const confirmDiv = document.createElement('div');
        confirmDiv.className = 'confirm-buttons';
        confirmDiv.classList.toggle('hidden', false);

        const saveButton = document.createElement('button');
        saveButton.textContent = 'Guardar';
        saveButton.addEventListener('click', () => {
          const nuevoTexto = editText.value;
          const nuevaFecha = editDate.value;
          const nuevaPrioridad = editPriority.value;
          if (nuevoTexto.trim() === '' || isNaN(new Date(nuevaFecha).getTime())) {
            alert('¡Texto vacío o fecha inválida!');
            return;
          }
          pushUndoState();
          task.text = nuevoTexto;
          task.dueDate = nuevaFecha;
          task.priority = nuevaPrioridad;
          renderTasks();
        });

        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancelar';
        cancelButton.addEventListener('click', () => {
          renderTasks();
        });

        confirmDiv.appendChild(saveButton);
        confirmDiv.appendChild(cancelButton);

        contentDiv.appendChild(editText);
        contentDiv.appendChild(editDate);
        contentDiv.appendChild(editPriority);
        contentDiv.appendChild(confirmDiv);

        editText.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') saveButton.click();
        });
        editText.addEventListener('blur', () => {
          setTimeout(() => {
            if (!document.activeElement.closest('.confirm-buttons')) {
              renderTasks();
            }
          }, 100);
        });
      });
      actionsDiv.appendChild(editButton);

      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Eliminar';
      deleteButton.addEventListener('click', () => {
        pushUndoState();
        // Animar fade-out antes de eliminar
        animateRemoval(li, () => {
          tasks = tasks.filter(t => t.id !== task.id);
          renderTasks();
        });
      });
      actionsDiv.appendChild(deleteButton);

      li.appendChild(actionsDiv);
      taskListUL.appendChild(li);
    });

    saveData();
  }

  undoButton.addEventListener('click', undo);
  redoButton.addEventListener('click', redo);

  filterAllBtn.addEventListener('click', () => { currentFilter = 'all'; renderTasks(); });
  filterCompletedBtn.addEventListener('click', () => { currentFilter = 'completed'; renderTasks(); });
  filterPendingBtn.addEventListener('click', () => { currentFilter = 'pending'; renderTasks(); });

  renderTasks();
});