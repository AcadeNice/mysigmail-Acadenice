<?php

namespace Espo\Custom\Controllers;

use Espo\Core\Api\Request;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Forbidden;
use Espo\Core\Exceptions\NotFound;
use Espo\Core\ORM\Repository\Option\SaveOption;
use Espo\Entities\Preferences;
use Espo\Entities\User;
use Espo\ORM\EntityManager;
use stdClass;

class SignaturePreferences
{
    private const API_USER_NAME = 'n8n_cv';

    public function __construct(
        private EntityManager $entityManager,
        private User $user,
    ) {}

    public function postActionUpdateSignature(Request $request): stdClass
    {
        if (!$this->user->isApi() || $this->user->get('userName') !== self::API_USER_NAME) {
            throw new Forbidden();
        }

        $data = $request->getParsedBody();
        $email = $this->stringValue($data->email ?? null);
        $signature = $this->stringValue($data->signature ?? null, allowEmpty: true);

        if (!$email || $signature === null) {
            throw new BadRequest('Missing email or signature.');
        }

        $targetUser = $this->findActiveUserByEmail($email);

        if (!$targetUser) {
            throw new NotFound('signature_user_not_found');
        }

        $preferences = $this->entityManager
            ->getRepository(Preferences::ENTITY_TYPE)
            ->getById($targetUser->getId());

        if (!$preferences) {
            throw new NotFound('signature_preferences_not_found');
        }

        $preferences->set('signature', $signature);
        $this->entityManager->saveEntity($preferences, [SaveOption::SKIP_HOOKS => true]);

        return (object) [
            'ok' => true,
            'user' => (object) [
                'id' => $targetUser->getId(),
                'name' => $targetUser->getName(),
                'userName' => $targetUser->get('userName'),
                'emailAddress' => $targetUser->get('emailAddress'),
            ],
        ];
    }

    private function findActiveUserByEmail(string $email): ?User
    {
        $users = $this->entityManager
            ->getRDBRepository(User::ENTITY_TYPE)
            ->where(['emailAddress' => $email])
            ->find();

        $activeUsers = [];

        foreach ($users as $user) {
            if ($user instanceof User && $user->isActive()) {
                $activeUsers[] = $user;
            }
        }

        if (count($activeUsers) > 1) {
            throw new BadRequest('multiple_users_found');
        }

        return $activeUsers[0] ?? null;
    }

    private function stringValue(mixed $value, bool $allowEmpty = false): ?string
    {
        if (!is_string($value)) {
            return null;
        }

        if ($allowEmpty) {
            return $value;
        }

        $value = trim($value);

        return $value !== '' ? $value : null;
    }
}
