# Políticas de Segurança e Privacidade

Este documento descreve as políticas de segurança e privacidade implementadas no Resutorant, incluindo as regras de Row Level Security (RLS) e as checagens explícitas na camada de aplicação.

## Visão Geral

O Resutorant implementa uma abordagem de **defense-in-depth** para proteger dados privados:

1. **RLS (Row Level Security)** no banco de dados Supabase como primeira linha de defesa
2. **Filtros explícitos na camada de aplicação** como camada adicional de proteção
3. **Validação de propriedade** em operações de escrita (update/delete)

## Tabelas Sensíveis

### Reviews (`reviews`)

**Campos de privacidade:**
- `is_private` (boolean): Indica se o review é privado ou público

**Políticas de acesso:**
- **Reviews públicos** (`is_private = false`): Visíveis para todos os usuários autenticados
- **Reviews privados** (`is_private = true`): Visíveis apenas para:
  - O próprio autor (`user_id = viewer_id`)
  - Administradores (quando aplicável)

**Queries afetadas:**
- `getRecentReviews()` - Filtra reviews privados, exceto do viewer
- `getReviewsByUser()` - Mostra apenas públicos quando viewer ≠ owner
- `searchReviews()` - Filtra reviews privados, exceto do viewer
- `getVenueReviews()` - Filtra reviews privados, exceto do viewer
- `getComments()` - Verifica se o review é público antes de mostrar comentários

### Listas (`lists`)

**Campos de privacidade:**
- `is_public` (boolean): Indica se a lista é pública ou privada

**Políticas de acesso:**
- **Listas públicas** (`is_public = true`): Visíveis para todos os usuários autenticados
- **Listas privadas** (`is_public = false`): Visíveis apenas para:
  - O próprio dono (`user_id = viewer_id`)

**Queries afetadas:**
- `getListDetails()` - Filtra listas privadas, exceto do viewer
- `searchLists()` - Já filtra apenas listas públicas
- `getUserListsWithCounts()` - Respeita `includePrivate` quando viewer = owner

**Nota especial:** Quando uma lista pública contém items com reviews privados, esses reviews são filtrados na resposta de `getListDetails()` se o viewer não for o dono do review.

### Comentários (`comments`)

**Políticas de acesso:**
- Comentários só são visíveis se o review associado (`log_id`) for:
  - Público (`is_private = false`), OU
  - Privado mas pertencente ao viewer (`user_id = viewer_id`)

**Queries afetadas:**
- `getComments()` - Verifica privacidade do review antes de retornar comentários

### Perfis (`profiles`)

**Políticas de acesso:**
- Perfis são públicos por padrão (apenas `username` é obrigatório)
- Informações sensíveis (email, etc.) são gerenciadas pelo Supabase Auth

**Queries afetadas:**
- `getProfile()` - Sempre retorna o perfil completo (dados públicos)
- `getProfileByUsername()` - Retorna perfil público por username
- `searchProfiles()` - Busca perfis públicos

## Implementação Técnica

### Padrão de Filtros Explícitos

Todas as queries públicas seguem este padrão:

```typescript
// Exemplo: getRecentReviews
export async function getRecentReviews(
  limit: number,
  viewerId?: string, // ID do usuário visualizando (opcional)
): Promise<ReviewWithVenue[]> {
  let query = supabase.from('reviews').select('*');
  
  // Filtro explícito de privacidade
  if (viewerId) {
    // Mostra públicos OU do próprio viewer
    query = query.or(`is_private.eq.false,user_id.eq.${viewerId}`);
  } else {
    // Sem viewerId, apenas públicos
    query = query.eq('is_private', false);
  }
  
  // ... resto da query
}
```

### Passando viewerId

O `viewerId` deve ser passado em todas as chamadas de queries públicas:

```typescript
// Em componentes client-side
const { data: { user } } = await supabase.auth.getUser();
const reviews = await getRecentReviews(20, user?.id);

// Em server components
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
const reviews = await getVenueReviews(venueId, user?.id);
```

## RLS Policies Esperadas

Embora o código implemente filtros explícitos, as seguintes políticas RLS devem existir no banco:

### Reviews
- **SELECT**: Usuários podem ver reviews públicos OU seus próprios reviews privados
- **INSERT**: Usuários podem criar reviews (com `user_id = auth.uid()`)
- **UPDATE**: Usuários podem atualizar apenas seus próprios reviews
- **DELETE**: Usuários podem deletar apenas seus próprios reviews (ou admins podem deletar públicos)

### Listas
- **SELECT**: Usuários podem ver listas públicas OU suas próprias listas privadas
- **INSERT**: Usuários podem criar listas (com `user_id = auth.uid()`)
- **UPDATE**: Usuários podem atualizar apenas suas próprias listas
- **DELETE**: Usuários podem deletar apenas suas próprias listas (ou admins podem deletar públicas)

### Comentários
- **SELECT**: Usuários podem ver comentários de reviews públicos OU reviews privados próprios
- **INSERT**: Usuários podem comentar em reviews públicos OU seus próprios reviews privados
- **UPDATE/DELETE**: Usuários podem modificar apenas seus próprios comentários

## Validação de Propriedade

Operações de escrita sempre validam propriedade explicitamente:

```typescript
// Exemplo: updateLog
const { data: existingReview } = await supabase
  .from('reviews')
  .select('user_id')
  .eq('id', logId)
  .single();

if (existingReview.user_id !== userId) {
  throw new Error('Unauthorized');
}
```

## Admin Privileges

Administradores (`profiles.is_admin = true`) têm permissões especiais:

- Podem deletar reviews públicos de outros usuários
- Podem deletar listas públicas de outros usuários
- **NÃO** podem acessar reviews/listas privadas de outros usuários (por design)

## Checklist de Segurança

Ao adicionar novas queries públicas, verifique:

- [ ] Query filtra dados privados quando `viewerId` não é o owner?
- [ ] Query aceita `viewerId` opcional como parâmetro?
- [ ] Todos os call sites passam `viewerId` quando disponível?
- [ ] Operações de escrita validam propriedade explicitamente?
- [ ] Documentação foi atualizada com a nova query?

## Auditoria e Monitoramento

Recomendações para monitoramento:

1. **Logs de acesso**: Monitorar tentativas de acesso a dados privados
2. **RLS violations**: Verificar logs do Supabase para políticas que falharam
3. **Query performance**: Filtros explícitos podem impactar performance em grandes volumes

## Referências

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Defense in Depth](https://en.wikipedia.org/wiki/Defense_in_depth_(computing))
