# Metrônomo Web

Um metrônomo web construído com JavaScript puro e Web Audio API, projetado para auxiliar nos estudos de bateria e para aprimorar minhas habilidades de programação.
<img width="1920" height="919" alt="image" src="https://github.com/user-attachments/assets/a84cd5bf-82f7-44b6-877f-69fe3131c76a" />


---

## Funcionalidades

* **Controle de BPM:** Ajuste preciso de batidas por minuto (BPM) através de um campo numérico ou de um controle deslizante.
* **Subdivisões Complexas:** Suporte para subdivisões rítmicas comuns e complexas:
    * Figuras de tempo (semínima, colcheia, semicolcheia, fusa).
    * Quiálteras para estudos de polirritmia (tercinas, quintinas, sextinas e septinas).
* **Compassos:**
     * Permite mudar o compasso para 2/4, 3/4, ..., até 9/8
* **Botão de Tap:**
     * Botão para configurar a velocidade de acordo com os cliques
* **Mixer de Volume Individual:** Controle independente do volume para cada tipo de batida:
    * **Acento:** O primeiro tempo do compasso.
    * **Batida:** Os demais tempos do compasso.
    * **Subdivisão:** As notas entre as batidas principais.
* **Acentuação Configurável:** Ative ou desative o acento no primeiro tempo do compasso com um simples clique.
* **Persistência de Configurações:** Suas preferências de volume são salvas no `localStorage` do navegador, mantendo seus ajustes entre as sessões.

---

## Tecnologias Utilizadas

* **HTML5**
* **Tailwind CSS v4**
* **JavaScript (ES6+)**
* **Web Audio API** (para baixa latência e controle preciso do áudio)
* **Node.js + npm** (para o ambiente de desenvolvimento local)
* Google Gemini

---

## Como Rodar o Projeto Localmente

Para rodar este projeto na sua máquina, siga os passos abaixo. Você vai precisar ter o [Node.js](https://nodejs.org/) instalado.

```bash
# 1. Clone o repositório
git clone [URL_DO_SEU_REPOSITORIO_NO_GITHUB]

# 2. Navegue até a pasta do projeto
cd nome-da-pasta-do-projeto

# 3. Instale as dependências (incluindo o Tailwind CSS)
npm install

# 4. Inicie o processo de build do Tailwind em modo "watch"
# Ele irá gerar o arquivo output.css e ficará monitorando por mudanças
npm run build 

# 5. Abra o arquivo metronomo.html no seu navegador
# Você pode usar uma extensão como a "Live Server" no VS Code para facilitar.
```

---

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
