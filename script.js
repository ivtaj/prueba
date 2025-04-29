document.addEventListener('DOMContentLoaded', () => {
  const themeSelect = document.getElementById('theme');
  const form = document.querySelector('.task-form form');
  const taskInput = document.getElementById('task');
  const dueDateInput = document.getElementById('due-date');
  const prioritySelect = document.getElementById('priority');
  const taskListUL = document.querySelector('.task-list ul');

  // Botones de filtro (todas, completadas, pendientes)
  const filterAllBtn = document.getElementById('filter-all');
  const filterCompletedBtn = document.getElementById('filter-completed');
  const filterPendingBtn = document.getElementById('filter-pending');

  let tasks = [];
  let editingTaskId = null;
  let currentFilter = 'all';

  // Cambiar tema de claro a oscuro y actualizar color de texto para encabezado y formulario
  themeSelect.addEventListener('change', (e) => {
    if (e.target.value === 'dark') {
      document.body.style.background = '#000';
      document.querySelectorAll('header h1, header label, .task-form label').forEach(el => {
        el.style.color = '#fff';
      });
    } else {
      document.body.style.background = '';
      document.querySelectorAll('header h1, header label, .task-form label').forEach(el => {
        el.style.color = '';
      });
    }
  });

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

    if (editingTaskId !== null) {
      tasks = tasks.map(task => {
        if (task.id === editingTaskId) {
          return { ...task, text: taskText, dueDate, priority };
        }
        return task;
      });
      editingTaskId = null;
    } else {
      tasks.push({
        id: Date.now(),
        text: taskText,
        dueDate,
        priority,
        completed: false,
      });
    }
    form.reset();
    renderTasks();
  });

  // Función para renderizar las tareas según el filtro actual
  function renderTasks() {
    let filteredTasks = tasks;
    if (currentFilter === 'completed') {
      filteredTasks = tasks.filter(task => task.completed);
    } else if (currentFilter === 'pending') {
      filteredTasks = tasks.filter(task => !task.completed);
    }
    
    taskListUL.innerHTML = '';
    filteredTasks.forEach(task => {
      const li = document.createElement('li');
      const leftDiv = document.createElement('div');

      // Checkbox para marcar la tarea como completada
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `task-${task.id}`;
      checkbox.checked = task.completed;
      checkbox.addEventListener('change', () => {
        task.completed = checkbox.checked;
        renderTasks();
      });
      leftDiv.appendChild(checkbox);

      // Label de la tarea (texto sin cambios en modo oscuro)
      const label = document.createElement('label');
      label.setAttribute('for', `task-${task.id}`);
      label.textContent = task.text + (task.dueDate ? ' (Fecha límite: ' + task.dueDate + ')' : '');
      leftDiv.appendChild(label);

      // Etiqueta de prioridad
      const prioritySpan = document.createElement('span');
      prioritySpan.className = 'priority';
      prioritySpan.setAttribute('title', task.priority);
      prioritySpan.textContent = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
      leftDiv.appendChild(prioritySpan);

      li.appendChild(leftDiv);

      // Acciones: Editar y Eliminar
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'actions';

      const editButton = document.createElement('button');
      editButton.textContent = 'Editar';
      editButton.addEventListener('click', () => {
        taskInput.value = task.text;
        dueDateInput.value = task.dueDate;
        prioritySelect.value = task.priority;
        editingTaskId = task.id;
      });
      actionsDiv.appendChild(editButton);

      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Eliminar';
      deleteButton.addEventListener('click', () => {
        tasks = tasks.filter(t => t.id !== task.id);
        renderTasks();
      });
      actionsDiv.appendChild(deleteButton);

      li.appendChild(actionsDiv);
      taskListUL.appendChild(li);
    });
  }

  // Filtros de tareas: todas, completadas y pendientes
  filterAllBtn.addEventListener('click', () => {
    currentFilter = 'all';
    renderTasks();
  });
  filterCompletedBtn.addEventListener('click', () => {
    currentFilter = 'completed';
    renderTasks();
  });
  filterPendingBtn.addEventListener('click', () => {
    currentFilter = 'pending';
    renderTasks();
  });

  // Renderizar las tareas al cargar la página
  renderTasks();
});