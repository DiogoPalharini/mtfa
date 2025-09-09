# MTFA - Multi-Factor Authentication App

## 📱 Estrutura do Projeto

Este projeto utiliza **Expo Router** para navegação baseada em arquivos, criando uma estrutura limpa e organizada.

### 🗂️ Estrutura de Arquivos

```
mtfa/
├── app/                    # Pasta principal do Expo Router
│   ├── _layout.tsx        # Layout principal da aplicação
│   ├── index.tsx          # Tela de login (rota inicial)
│   ├── home.tsx           # Tela principal após login
│   └── +not-found.tsx     # Tela de erro 404
├── App.tsx                # Componente raiz (usa Slot do Expo Router)
├── assets/                 # Imagens e recursos
└── package.json           # Dependências do projeto
```

## 🚀 Como Funciona

### 1. **Navegação Automática**
- O Expo Router detecta automaticamente os arquivos na pasta `app/`
- Cada arquivo `.tsx` se torna uma rota automaticamente
- `index.tsx` = rota `/` (tela inicial)
- `home.tsx` = rota `/home`

### 2. **Fluxo de Navegação**
```
Login (/) → Home (/home) → Logout → Login (/)
```

### 3. **Layout Compartilhado**
- `_layout.tsx` define o layout comum para todas as telas
- Configurações globais como StatusBar e Stack Navigator

## 🎨 Design System

### Cores
- **Background**: `#F8F9FA` (fundo suave)
- **Surface**: `#FFFFFF` (cards e elementos)
- **Primary**: `#0052CC` (botões principais)
- **Text**: `#212529` (texto principal)
- **TextSecondary**: `#6C757D` (texto secundário)
- **Border**: `#E0E0E0` (bordas)
- **Error**: `#DC3545` (estados de erro)

### Tipografia
- **Títulos**: Bold, 28-32px
- **Subtítulos**: Regular, 16px
- **Corpo**: Regular, 14-18px
- **Botões**: Bold, 18px

## 🔧 Funcionalidades

### Tela de Login (`/`)
- ✅ Campos de usuário/email e senha
- ✅ Validação com react-hook-form
- ✅ Ícone de mostrar/ocultar senha
- ✅ Estados de loading e erro
- ✅ Design responsivo
- ✅ Navegação automática após login

### Tela Home (`/home`)
- ✅ Dashboard principal
- ✅ Cards informativos
- ✅ Botão de logout
- ✅ Navegação de volta ao login

### Tratamento de Erros
- ✅ Tela 404 personalizada
- ✅ Navegação de volta ao login
- ✅ Design consistente

## 📱 Como Executar

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Iniciar o projeto:**
   ```bash
   npm start
   ```

3. **Executar no dispositivo:**
   - Escaneie o QR code com Expo Go
   - Ou pressione `a` para Android ou `i` para iOS

## 🛠️ Tecnologias Utilizadas

- **React Native** - Framework mobile
- **Expo** - Plataforma de desenvolvimento
- **Expo Router** - Sistema de navegação
- **React Hook Form** - Gerenciamento de formulários
- **TypeScript** - Tipagem estática
- **@expo/vector-icons** - Ícones

## 🔄 Próximos Passos

Para expandir o app, você pode:

1. **Adicionar novas telas** criando arquivos na pasta `app/`
2. **Implementar autenticação real** substituindo a simulação
3. **Adicionar persistência** com AsyncStorage
4. **Implementar validação de API** com react-query
5. **Adicionar testes** com Jest e Testing Library

## 📝 Notas

- O app está configurado para usar o Expo Router v5
- Todas as telas seguem o design system estabelecido
- A navegação é automática e baseada em arquivos
- O layout é responsivo e funciona em diferentes tamanhos de tela
