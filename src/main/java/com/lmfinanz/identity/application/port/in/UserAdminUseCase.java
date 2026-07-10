package com.lmfinanz.identity.application.port.in;

import com.lmfinanz.identity.adapter.in.web.dto.AdminUserResponse;
import com.lmfinanz.identity.adapter.in.web.dto.UserRolesRequest;
import java.util.List;
import java.util.UUID;

public interface UserAdminUseCase {

    List<AdminUserResponse> list();

    AdminUserResponse get(UUID userId);

    AdminUserResponse activate(UUID userId);

    AdminUserResponse deactivate(UUID currentUserId, UUID userId);

    AdminUserResponse replaceRoles(UUID currentUserId, UUID userId, UserRolesRequest request);
}
